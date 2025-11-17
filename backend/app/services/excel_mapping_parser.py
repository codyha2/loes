"""
Service để parse file Excel và tạo mapping CLO-PLO tự động
"""
import pandas as pd
import logging
import re
from typing import Dict, List, Optional, Tuple
from sqlmodel import Session, select
from app.models import Course, CLO, PLO, CLOPLOMapping

logger = logging.getLogger(__name__)

# Mapping từ giá trị Excel sang contribution_level
EXCEL_TO_CONTRIBUTION = {
    "H": "M",  # High -> Major
    "M": "M",  # Master -> Major
    "N": "N",  # Nắm vững -> Neutral
    "S": "L",  # Sử dụng -> Low
    "L": "L",  # Low -> Low
    "I": "L",  # Introduce -> Low
    "R": "N",  # Reinforce -> Neutral
    "A": "M",  # Assessed -> Major
    "": None,  # Rỗng -> không map
    "-": None,
    "x": "L",
    "✓": "N",
    "v": "N",
}

def normalize_excel_value(value: any) -> Optional[str]:
    """
    Chuẩn hóa giá trị từ Excel sang contribution_level
    
    Args:
        value: Giá trị từ ô Excel
        
    Returns:
        Contribution level (M, N, L) hoặc None nếu không map
    """
    if value is None or pd.isna(value):
        return None
    
    value_str = str(value).strip().upper()
    
    # Nếu là số, không map
    try:
        int(value_str)
        return None
    except ValueError:
        pass
    
    # Tìm trong mapping
    if value_str in EXCEL_TO_CONTRIBUTION:
        return EXCEL_TO_CONTRIBUTION[value_str]
    
    # Nếu không match, thử lowercase
    value_lower = value_str.lower()
    for key, level in EXCEL_TO_CONTRIBUTION.items():
        if key.lower() == value_lower:
            return level
    
    return None

def find_header_row(df: pd.DataFrame, max_rows: int = 10) -> Optional[int]:
    """Tìm dòng header"""
    stt_keywords = ['stt', 'tt', 'số thứ tự']
    code_keywords = ['mã học phần', 'mã học', 'code', 'course code']
    name_keywords = ['tên học phần', 'tên học', 'name', 'course name']
    
    for idx in range(min(max_rows, len(df))):
        row = df.iloc[idx]
        row_str = ' '.join([str(cell).lower() for cell in row.values if pd.notna(cell)])
        
        has_stt = any(kw in row_str for kw in stt_keywords)
        has_code = any(kw in row_str for kw in code_keywords)
        has_name = any(kw in row_str for kw in name_keywords)
        
        if (has_stt or has_code) and (has_code or has_name):
            return idx
    
    return None

def extract_columns(df: pd.DataFrame, header_row: int) -> Tuple[Optional[str], Optional[str], List[str]]:
    """
    Trích xuất code_col, name_col, và danh sách PLO columns
    
    Returns:
        (code_col, name_col, plo_cols)
    """
    code_col = None
    name_col = None
    plo_cols = []
    
    # Tìm code column
    code_keywords = ['mã học phần', 'mã học', 'code', 'course code']
    for col in df.columns:
        col_lower = str(col).lower()
        if any(kw in col_lower for kw in code_keywords):
            code_col = col
            break
    
    # Tìm name column
    name_keywords = ['tên học phần', 'tên học', 'name', 'course name']
    for col in df.columns:
        col_lower = str(col).lower()
        if any(kw in col_lower for kw in name_keywords):
            name_col = col
            break
    
    # Tìm PLO columns (các cột có ELO hoặc PLO trong tên, sau name_col)
    if name_col:
        name_col_idx = df.columns.get_loc(name_col)
        for i in range(name_col_idx + 1, len(df.columns)):
            col = df.columns[i]
            col_str = str(col).upper()
            if 'ELO' in col_str or 'PLO' in col_str:
                plo_cols.append(col)
    else:
        # Nếu không có name_col, tìm tất cả cột có ELO/PLO
        for col in df.columns:
            col_str = str(col).upper()
            if 'ELO' in col_str or 'PLO' in col_str:
                plo_cols.append(col)
    
    return code_col, name_col, plo_cols

def parse_excel_mapping(
    file_path: str,
    session: Session,
    program_id: int,
    sheet_name: Optional[str] = None
) -> Dict[str, any]:
    """
    Parse file Excel và tạo mapping CLO-PLO
    
    Args:
        file_path: Đường dẫn file Excel
        session: Database session
        program_id: ID của program
        sheet_name: Tên sheet cần parse (None = parse tất cả)
        
    Returns:
        Dict chứa kết quả: {
            "courses_processed": int,
            "mappings_created": int,
            "mappings_updated": int,
            "errors": List[str]
        }
    """
    logger.info(f"Parsing Excel file: {file_path}")
    
    excel_file = pd.ExcelFile(file_path)
    sheets_to_process = [sheet_name] if sheet_name else excel_file.sheet_names
    
    total_courses = 0
    total_mappings_created = 0
    total_mappings_updated = 0
    errors = []
    
    # Lấy tất cả PLOs của program
    plos_statement = select(PLO).where(PLO.program_id == program_id)
    plos = session.exec(plos_statement).all()
    plo_dict = {}  # Map PLO code/name -> PLO object
    
    for plo in plos:
        # Thử match theo code
        plo_code = str(plo.code).strip().upper() if plo.code else ""
        if plo_code:
            plo_dict[plo_code] = plo
            # Nếu code có format ELO1, ELO2, ... thì cũng thêm vào dict
            match = re.search(r'(ELO|PLO)\s*(\d+)', plo_code)
            if match:
                # Thêm cả format không có space: ELO1, ELO2
                normalized = f"{match.group(1)}{match.group(2)}"
                plo_dict[normalized] = plo
    
    for sheet in sheets_to_process:
        try:
            df = pd.read_excel(excel_file, sheet_name=sheet, header=None)
            logger.info(f"Processing sheet: {sheet} ({len(df)} rows)")
            
            # Tìm header
            header_row = find_header_row(df)
            if header_row is None:
                errors.append(f"Sheet '{sheet}': Không tìm thấy header")
                continue
            
            # Trích xuất columns
            code_col, name_col, plo_cols = extract_columns(df, header_row)
            
            if not code_col:
                errors.append(f"Sheet '{sheet}': Không tìm thấy cột mã học phần")
                continue
            
            if not plo_cols:
                errors.append(f"Sheet '{sheet}': Không tìm thấy cột PLO/ELO")
                continue
            
            # Lấy data từ dòng sau header
            data_df = df.iloc[header_row + 1:].copy()
            
            # Xử lý từng dòng
            for idx, row in data_df.iterrows():
                try:
                    course_code = str(row[code_col]).strip() if pd.notna(row[code_col]) else ""
                    
                    if not course_code:
                        continue
                    
                    # Tìm course theo code
                    course_statement = select(Course).where(Course.code == course_code)
                    course = session.exec(course_statement).first()
                    
                    if not course:
                        errors.append(f"Sheet '{sheet}', dòng {idx + header_row + 2}: Không tìm thấy môn học với mã '{course_code}'")
                        continue
                    
                    total_courses += 1
                    
                    # Lấy tất cả CLOs của course
                    clos_statement = select(CLO).where(CLO.course_id == course.id)
                    clos = session.exec(clos_statement).all()
                    
                    if not clos:
                        errors.append(f"Sheet '{sheet}', dòng {idx + header_row + 2}: Môn học '{course_code}' không có CLO")
                        continue
                    
                    # Xử lý từng cột PLO
                    for plo_col in plo_cols:
                        plo_name = str(plo_col).strip()
                        value = row[plo_col] if plo_col in row.index else None
                        contribution_level = normalize_excel_value(value)
                        
                        if not contribution_level:
                            continue  # Không map nếu giá trị rỗng hoặc không hợp lệ
                        
                        # Tìm PLO tương ứng
                        plo = None
                        # Thử match theo tên cột (ELO1, ELO2, ...)
                        plo_col_upper = plo_name.upper()
                        if plo_col_upper in plo_dict:
                            plo = plo_dict[plo_col_upper]
                        else:
                            # Thử tìm theo pattern ELO/PLO + số
                            match = re.search(r'(ELO|PLO)\s*(\d+)', plo_col_upper)
                            if match:
                                prefix = match.group(1)
                                num = match.group(2)
                                search_key = f"{prefix}{num}"
                                if search_key in plo_dict:
                                    plo = plo_dict[search_key]
                        
                        if not plo:
                            # Thử tìm PLO theo thứ tự (nếu cột là ELO1, ELO2, ...)
                            try:
                                match = re.search(r'(\d+)', plo_name)
                                if match:
                                    plo_index = int(match.group(1)) - 1
                                    if 0 <= plo_index < len(plos):
                                        plo = plos[plo_index]
                            except:
                                pass
                        
                        if not plo:
                            errors.append(f"Sheet '{sheet}', dòng {idx + header_row + 2}: Không tìm thấy PLO cho cột '{plo_name}'")
                            continue
                        
                        # Tạo mapping cho tất cả CLOs của course này
                        for clo in clos:
                            # Kiểm tra mapping đã tồn tại chưa
                            existing_statement = select(CLOPLOMapping).where(
                                CLOPLOMapping.clo_id == clo.id,
                                CLOPLOMapping.plo_id == plo.id
                            )
                            existing = session.exec(existing_statement).first()
                            
                            if existing:
                                # Cập nhật
                                existing.contribution_level = contribution_level
                                session.add(existing)
                                total_mappings_updated += 1
                            else:
                                # Tạo mới
                                mapping = CLOPLOMapping(
                                    clo_id=clo.id,
                                    plo_id=plo.id,
                                    contribution_level=contribution_level
                                )
                                session.add(mapping)
                                total_mappings_created += 1
                    
                except Exception as e:
                    errors.append(f"Sheet '{sheet}', dòng {idx + header_row + 2}: {str(e)}")
                    logger.error(f"Error processing row {idx}: {e}", exc_info=True)
                    continue
            
            session.commit()
            logger.info(f"Sheet '{sheet}': Đã xử lý {total_courses} môn học")
            
        except Exception as e:
            errors.append(f"Sheet '{sheet}': Lỗi khi xử lý - {str(e)}")
            logger.error(f"Error processing sheet {sheet}: {e}", exc_info=True)
            continue
    
    return {
        "courses_processed": total_courses,
        "mappings_created": total_mappings_created,
        "mappings_updated": total_mappings_updated,
        "errors": errors
    }

