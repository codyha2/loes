from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List, Optional
import tempfile
import os
from app.database import get_session
from app.models import CLOPLOMapping, CLO, PLO, Program
from app.schemas import CLOPLOMappingCreate, CLOPLOMappingUpdate, CLOPLOMappingResponse
from app.auth import get_current_user
from app.services.excel_mapping_parser import parse_excel_mapping

router = APIRouter()

@router.get("/course/{course_id}/clo-plo-mapping", response_model=List[CLOPLOMappingResponse])
async def get_clo_plo_mapping(
    course_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách mapping CLO-PLO của môn học"""
    # Lấy tất cả CLOs của course
    clos_statement = select(CLO).where(CLO.course_id == course_id)
    clos = session.exec(clos_statement).all()
    
    if not clos:
        return []
    
    clo_ids = [clo.id for clo in clos]
    
    # Lấy tất cả mappings
    statement = select(CLOPLOMapping).where(CLOPLOMapping.clo_id.in_(clo_ids))
    mappings = session.exec(statement).all()
    return mappings

@router.post("/clo-plo-mapping", response_model=CLOPLOMappingResponse)
async def create_clo_plo_mapping(
    mapping_data: CLOPLOMappingCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Tạo mapping CLO-PLO"""
    # Kiểm tra CLO và PLO tồn tại
    clo = session.get(CLO, mapping_data.clo_id)
    if not clo:
        raise HTTPException(status_code=404, detail="Không tìm thấy CLO")
    
    plo = session.get(PLO, mapping_data.plo_id)
    if not plo:
        raise HTTPException(status_code=404, detail="Không tìm thấy PLO")
    
    # Kiểm tra mapping đã tồn tại chưa
    statement = select(CLOPLOMapping).where(
        CLOPLOMapping.clo_id == mapping_data.clo_id,
        CLOPLOMapping.plo_id == mapping_data.plo_id
    )
    existing = session.exec(statement).first()
    if existing:
        # Cập nhật contribution_level
        existing.contribution_level = mapping_data.contribution_level
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    
    # Tạo mới
    mapping = CLOPLOMapping(**mapping_data.model_dump())
    session.add(mapping)
    session.commit()
    session.refresh(mapping)
    return mapping

@router.put("/clo-plo-mapping/{mapping_id}", response_model=CLOPLOMappingResponse)
async def update_clo_plo_mapping(
    mapping_id: int,
    mapping_data: CLOPLOMappingUpdate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Cập nhật mapping CLO-PLO - chỉ cần contribution_level"""
    mapping = session.get(CLOPLOMapping, mapping_id)
    if not mapping:
        raise HTTPException(status_code=404, detail="Không tìm thấy mapping")
    
    mapping.contribution_level = mapping_data.contribution_level
    session.add(mapping)
    session.commit()
    session.refresh(mapping)
    return mapping

@router.delete("/clo-plo-mapping/{mapping_id}")
async def delete_clo_plo_mapping(
    mapping_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Xóa mapping CLO-PLO"""
    mapping = session.get(CLOPLOMapping, mapping_id)
    if not mapping:
        raise HTTPException(status_code=404, detail="Không tìm thấy mapping")
    
    session.delete(mapping)
    session.commit()
    return {"message": "Đã xóa mapping"}

@router.post("/clo-plo-mapping/import-excel")
async def import_excel_mapping(
    file: UploadFile = File(...),
    program_id: int = Form(...),
    sheet_name: Optional[str] = Form(None),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """
    Import mapping CLO-PLO từ file Excel
    
    File Excel phải có:
    - Cột mã học phần (Mã học phần, Mã học, Code, Course Code)
    - Cột tên học phần (Tên học phần, Tên học, Name, Course Name)
    - Các cột PLO/ELO (ELO1, ELO2, ..., PLO1, PLO2, ...)
    - Giá trị trong ô: H/M/A (Major), N/R (Neutral), S/L/I (Low), hoặc rỗng
    """
    # Kiểm tra program tồn tại
    program = session.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Không tìm thấy chương trình đào tạo")
    
    # Kiểm tra file extension
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File phải là định dạng Excel (.xlsx hoặc .xls)")
    
    # Lưu file tạm
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
            content = await file.read()
            tmp.write(content)
            temp_file = tmp.name
        
        # Parse Excel
        result = parse_excel_mapping(
            file_path=temp_file,
            session=session,
            program_id=program_id,
            sheet_name=sheet_name
        )
        
        return {
            "message": "Import thành công",
            "courses_processed": result["courses_processed"],
            "mappings_created": result["mappings_created"],
            "mappings_updated": result["mappings_updated"],
            "errors": result["errors"][:50]  # Giới hạn 50 lỗi đầu tiên
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi import file: {str(e)}")
    finally:
        # Xóa file tạm
        if temp_file and os.path.exists(temp_file):
            os.unlink(temp_file)

