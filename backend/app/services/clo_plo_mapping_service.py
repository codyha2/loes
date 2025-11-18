"""
Service tính toán mapping CLO-PLO dựa trên rule-based algorithm
Công thức: Score = 0.6*K + 0.3*B + 0.1*H
"""
import re
from typing import Dict, Any, List, Set
from app.models import CLO, PLO, BloomLevel


def tokenize_text(text: str) -> Set[str]:
    """Tokenize text thành set các từ khóa (loại bỏ stopwords cơ bản)"""
    # Chuyển sang lowercase và loại bỏ dấu câu
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Tách từ
    words = text.split()
    
    # Loại bỏ stopwords tiếng Việt cơ bản
    stopwords = {
        'và', 'của', 'cho', 'với', 'từ', 'trong', 'là', 'được', 'có', 'một', 'các',
        'theo', 'về', 'này', 'đó', 'nào', 'khi', 'sau', 'trước', 'để', 'bằng',
        'như', 'hoặc', 'nếu', 'thì', 'mà', 'đã', 'sẽ', 'đang', 'cũng', 'rất'
    }
    
    # Lọc và loại bỏ từ quá ngắn (< 2 ký tự)
    keywords = {w for w in words if len(w) >= 2 and w not in stopwords}
    
    return keywords


def jaccard_similarity(set1: Set[str], set2: Set[str]) -> float:
    """Tính Jaccard similarity giữa 2 sets"""
    if not set1 or not set2:
        return 0.0
    
    intersection = len(set1 & set2)
    union = len(set1 | set2)
    
    if union == 0:
        return 0.0
    
    return intersection / union


def get_bloom_score(bloom_level: str) -> float:
    """
    Tính điểm Bloom (B)
    Bloom 1-2 (Remember, Understand) → 0.33 (L)
    Bloom 3-4 (Apply, Analyze) → 0.66 (N)
    Bloom 5-6 (Evaluate, Create) → 1.0 (M)
    """
    level = bloom_level.lower()
    if level in ['remember', 'understand']:
        return 0.33  # Tương ứng L
    elif level in ['apply', 'analyze']:
        return 0.66  # Tương ứng N
    elif level in ['evaluate', 'create']:
        return 1.0   # Tương ứng M
    return 0.33  # Mặc định


def check_strong_keywords(clo_text: str, plo_description: str) -> float:
    """
    Kiểm tra CLO có chứa từ khóa mạnh của PLO không (H)
    Trả về 0.2 nếu có, 0 nếu không
    """
    clo_lower = clo_text.lower()
    plo_lower = plo_description.lower()
    
    # Extract keywords từ PLO
    plo_keywords = tokenize_text(plo_description)
    
    # Từ khóa mạnh thường là danh từ chính, động từ quan trọng
    # Kiểm tra xem có từ khóa nào của PLO xuất hiện trong CLO không
    clo_words = tokenize_text(clo_text)
    
    # Nếu có ít nhất 2 từ khóa chung → coi là có từ khóa mạnh
    common = clo_words & plo_keywords
    if len(common) >= 2:
        return 0.2
    
    # Hoặc nếu có từ khóa dài (> 4 ký tự) xuất hiện trong cả 2
    long_keywords = {w for w in plo_keywords if len(w) > 4}
    clo_long = {w for w in clo_words if len(w) > 4}
    if long_keywords & clo_long:
        return 0.2
    
    return 0.0


def calculate_mapping_score(clo: CLO, plo: PLO) -> float:
    """
    Tính score mapping giữa CLO và PLO
    Score = 0.6*K + 0.3*B + 0.1*H
    
    K = Jaccard similarity giữa keywords CLO và PLO
    B = Điểm Bloom (0.33 cho L, 0.66 cho N, 1.0 cho M)
    H = 0.2 nếu có từ khóa mạnh, 0 nếu không
    """
    # K: Jaccard similarity
    clo_text = f"{clo.verb} {clo.text}".lower()
    plo_text = plo.description.lower()
    
    clo_keywords = tokenize_text(clo_text)
    plo_keywords = tokenize_text(plo_text)
    
    K = jaccard_similarity(clo_keywords, plo_keywords)
    
    # B: Bloom score
    B = get_bloom_score(clo.bloom_level.value if isinstance(clo.bloom_level, BloomLevel) else clo.bloom_level)
    
    # H: Strong keywords
    H = check_strong_keywords(clo_text, plo_text)
    
    # Tính score
    score = 0.6 * K + 0.3 * B + 0.1 * H
    
    return score


def score_to_contribution_level(score: float) -> str:
    """
    Chuyển score sang mức contribution level
    Score ≥ 0.70 → M (Đóng góp mạnh)
    0.45 – 0.69 → N (Trung bình)
    0.20 – 0.44 → L (Thấp)
    < 0.20 → - (Không liên quan)
    """
    if score >= 0.70:
        return 'M'
    elif score >= 0.45:
        return 'N'
    elif score >= 0.20:
        return 'L'
    else:
        return '-'


def suggest_clo_plo_mapping(clo: CLO, plo: PLO) -> str:
    """
    Gợi ý mức đóng góp của CLO vào PLO
    Trả về: 'M', 'N', 'L', hoặc '-'
    """
    score = calculate_mapping_score(clo, plo)
    return score_to_contribution_level(score)



