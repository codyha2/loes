import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import AlertDialog from './AlertDialog';
import { sortClosWithDisplay, CLOWithDisplay } from '../utils/cloHelpers';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface CLO {
  id: number;
  code: string;
  verb: string;
  text: string;
  bloom_level: string;
}

interface PLO {
  id: number;
  code: string;
  description: string;
}

interface Mapping {
  id: number;
  clo_id: number;
  plo_id: number;
  contribution_level: string;
}

interface CLOPLOMatrixProps {
  courseId: number;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

const CLOPLOMatrix: React.FC<CLOPLOMatrixProps> = ({ courseId }) => {
  const [clos, setClos] = useState<CLOWithDisplay<CLO>[]>([]);
  const [plos, setPlos] = useState<PLO[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoSuggesting, setAutoSuggesting] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Import Excel states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    courses_processed: number;
    mappings_created: number;
    mappings_updated: number;
    errors: string[];
  } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  // Tokenize text thành keywords
  const tokenizeText = (text: string): Set<string> => {
    const stopwords = new Set([
      'và', 'của', 'cho', 'với', 'từ', 'trong', 'là', 'được', 'có', 'một', 'các',
      'theo', 'về', 'này', 'đó', 'nào', 'khi', 'sau', 'trước', 'để', 'bằng',
      'như', 'hoặc', 'nếu', 'thì', 'mà', 'đã', 'sẽ', 'đang', 'cũng', 'rất'
    ]);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopwords.has(w));
    
    return new Set(words);
  };

  // Tính Jaccard similarity
  const jaccardSimilarity = (set1: Set<string>, set2: Set<string>): number => {
    if (set1.size === 0 || set2.size === 0) return 0;
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    return intersection.size / union.size;
  };

  // Tính điểm Bloom (B)
  const getBloomScore = (bloomLevel: string): number => {
    const level = bloomLevel.toLowerCase();
    if (level === 'remember' || level === 'understand') return 0.33; // L
    if (level === 'apply' || level === 'analyze') return 0.66; // N
    if (level === 'evaluate' || level === 'create') return 1.0; // M
    return 0.33;
  };

  // Kiểm tra từ khóa mạnh (H)
  const checkStrongKeywords = (cloText: string, ploDescription: string): number => {
    const cloKeywords = tokenizeText(cloText);
    const ploKeywords = tokenizeText(ploDescription);
    
    const common = new Set(Array.from(cloKeywords).filter(x => ploKeywords.has(x)));
    if (common.size >= 2) return 0.2;
    
    const cloLong = new Set(Array.from(cloKeywords).filter(w => w.length > 4));
    const ploLong = new Set(Array.from(ploKeywords).filter(w => w.length > 4));
    const longCommon = new Set(Array.from(cloLong).filter(x => ploLong.has(x)));
    if (longCommon.size > 0) return 0.2;
    
    return 0.0;
  };

  // Tính score mapping: Score = 0.6*K + 0.3*B + 0.1*H
  const calculateMappingScore = (clo: CLO, plo: PLO): number => {
    const cloText = `${clo.verb} ${clo.text}`.toLowerCase();
    const ploText = plo.description.toLowerCase();
    
    const cloKeywords = tokenizeText(cloText);
    const ploKeywords = tokenizeText(ploText);
    
    const K = jaccardSimilarity(cloKeywords, ploKeywords);
    const B = getBloomScore(clo.bloom_level);
    const H = checkStrongKeywords(cloText, ploText);
    
    return 0.6 * K + 0.3 * B + 0.1 * H;
  };

  // Chuyển score sang contribution level
  const scoreToLevel = (score: number): string => {
    if (score >= 0.70) return 'M';
    if (score >= 0.45) return 'N';
    if (score >= 0.20) return 'L';
    return '-';
  };

  // Gợi ý mapping dựa trên thuật toán mới
  const suggestMapping = (clo: CLO, plo: PLO): string => {
    const score = calculateMappingScore(clo, plo);
    return scoreToLevel(score);
  };

  // Tự động gợi ý mapping khi load (sử dụng thuật toán mới)
  const autoSuggestMappings = useCallback(async (clos: CLOWithDisplay<CLO>[], plos: PLO[], existingMappings: Mapping[]) => {
    if (clos.length === 0 || plos.length === 0) {
      console.log('Không có CLO hoặc PLO để mapping');
      return;
    }

    setAutoSuggesting(true);
    const token = localStorage.getItem('token');
    const newMappings: Mapping[] = [];
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    console.log(`Bắt đầu auto-suggest: ${clos.length} CLOs, ${plos.length} PLOs, ${existingMappings.length} mappings hiện có`);

    try {
      for (const clo of clos) {
        for (const plo of plos) {
          // Kiểm tra xem đã có mapping chưa
          const existing = existingMappings.find(m => m.clo_id === clo.id && m.plo_id === plo.id);
          if (existing) {
            skipCount++;
            continue; // Bỏ qua nếu đã có
          }

          // Sử dụng thuật toán mới: Score = 0.6*K + 0.3*B + 0.1*H
          const suggestedLevel = suggestMapping(clo, plo);
          const score = calculateMappingScore(clo, plo);
          
          console.log(`CLO${clo.id} (${clo.verb} ${clo.text}) - PLO${plo.id}: score=${score.toFixed(3)}, level=${suggestedLevel}`);

          // Tạo mapping cho TẤT CẢ các level, kể cả '-' (để hiển thị trong ma trận)
          try {
            const response = await axios.post(
              `${API_URL}/api/clo-plo-mapping`,
              {
                clo_id: clo.id,
                plo_id: plo.id,
                contribution_level: suggestedLevel,
              },
              {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
              }
            );
            newMappings.push(response.data);
            successCount++;
          } catch (error: any) {
            // Nếu lỗi do đã tồn tại (400), bỏ qua
            if (error.response?.status === 400) {
              skipCount++;
            } else {
              console.error(`Lỗi khi tạo mapping CLO${clo.id}-PLO${plo.id}:`, error.response?.data || error.message);
              errorCount++;
            }
          }
        }
      }

      console.log(`Kết quả auto-suggest: ${successCount} thành công, ${skipCount} bỏ qua, ${errorCount} lỗi`);
      if (newMappings.length > 0) {
        setMappings([...existingMappings, ...newMappings]);
      }
    } catch (error) {
      console.error('Lỗi khi gợi ý tự động:', error);
    } finally {
      setAutoSuggesting(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchPrograms();
  }, [courseId]);

  const fetchPrograms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/programs/public`);
      setPrograms(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách chương trình:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [closRes, mappingsRes] = await Promise.all([
        axios.get(`${API_URL}/api/clos?course_id=${courseId}`),
        axios.get(`${API_URL}/api/course/${courseId}/clo-plo-mapping`),
      ]);
      const closData = sortClosWithDisplay<CLO>(closRes.data as CLO[]);
      setClos(closData);

      // Lấy program_id từ course để lấy PLOs
      const courseRes = await axios.get(`${API_URL}/api/courses/${courseId}`);
      const programId = courseRes.data.program_id;

      const plosRes = await axios.get(`${API_URL}/api/plos?program_id=${programId}`);
      const plosData = plosRes.data;
      setPlos(plosData);
      
      const existingMappings = mappingsRes.data;
      setMappings(existingMappings);

      // Tự động gợi ý mapping - LUÔN chạy để đảm bảo có mapping đầy đủ
      if (closData.length > 0 && plosData.length > 0) {
        const totalPossible = closData.length * plosData.length;
        const existingCount = existingMappings.length;
        
        // Luôn chạy auto-suggest để tạo mapping cho tất cả CLO-PLO
        // Chỉ bỏ qua nếu đã có đủ 100% mappings
        if (existingCount < totalPossible) {
          console.log(`Tự động tạo mapping: ${existingCount}/${totalPossible} mappings hiện có`);
          await autoSuggestMappings(closData, plosData, existingMappings);
          // Refresh lại mappings sau khi gợi ý
          const updatedMappingsRes = await axios.get(`${API_URL}/api/course/${courseId}/clo-plo-mapping`);
          setMappings(updatedMappingsRes.data);
        } else {
          console.log(`Đã có đủ mappings: ${existingCount}/${totalPossible}`);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced save function
  const saveMapping = useCallback(async (cloId: number, ploId: number, level: string | null) => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const existing = mappings.find(m => m.clo_id === cloId && m.plo_id === ploId);

        if (level === null || level === '-') {
          // Xóa mapping
          if (existing) {
            await axios.delete(`${API_URL}/api/clo-plo-mapping/${existing.id}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            setMappings(mappings.filter(m => m.id !== existing.id));
          }
        } else if (existing) {
          // Cập nhật mapping
          const response = await axios.put(
            `${API_URL}/api/clo-plo-mapping/${existing.id}`,
            { contribution_level: level },
            {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            }
          );
          setMappings(mappings.map(m => m.id === existing.id ? response.data : m));
        } else {
          // Tạo mapping mới
          const response = await axios.post(
            `${API_URL}/api/clo-plo-mapping`,
            {
              clo_id: cloId,
              plo_id: ploId,
              contribution_level: level,
            },
            {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            }
          );
          setMappings([...mappings, response.data]);
        }
      } catch (error: any) {
        console.error('Lỗi khi lưu mapping:', error);
        // Không hiển thị alert để tránh làm phiền user
      }
    }, 500); // Debounce 500ms
  }, [mappings]);

  const cycleContributionLevel = (cloId: number, ploId: number) => {
    const existing = mappings.find(m => m.clo_id === cloId && m.plo_id === ploId);
    const levels = ['-', 'L', 'N', 'M']; // Chu kỳ: - → L → N → M → -
    const currentLevel = existing ? existing.contribution_level : '-';
    const currentIndex = levels.indexOf(currentLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    const nextLevel = levels[nextIndex] === '-' ? null : levels[nextIndex];

    // Cập nhật UI ngay lập tức (optimistic update)
    if (nextLevel === null) {
      // Xóa
      if (existing) {
        setMappings(mappings.filter(m => m.id !== existing.id));
      }
    } else if (existing) {
      // Cập nhật
      setMappings(mappings.map(m => 
        m.id === existing.id ? { ...m, contribution_level: nextLevel } : m
      ));
    } else {
      // Tạo mới (tạm thời, sẽ được lưu sau)
      const tempMapping: Mapping = {
        id: Date.now(), // ID tạm
        clo_id: cloId,
        plo_id: ploId,
        contribution_level: nextLevel,
      };
      setMappings([...mappings, tempMapping]);
    }

    // Lưu với debounce
    saveMapping(cloId, ploId, nextLevel);
  };

  const getContributionLevel = (cloId: number, ploId: number): string | null => {
    const mapping = mappings.find(m => m.clo_id === cloId && m.plo_id === ploId);
    return mapping ? mapping.contribution_level : null;
  };

  const getTooltip = (level: string | null): string => {
    if (level === 'M') return 'Đóng góp lớn vào PLO này';
    if (level === 'N') return 'Đóng góp trung bình vào PLO này';
    if (level === 'L') return 'Đóng góp thấp vào PLO này';
    return 'Không liên quan';
  };

  const getCellStyle = (level: string | null) => {
    if (level === 'M') return 'bg-green-700 text-white'; // Xanh đậm
    if (level === 'N') return 'bg-blue-200 text-blue-900'; // Xanh nhạt
    if (level === 'L') return 'bg-yellow-200 text-yellow-900'; // Vàng nhạt
    return 'bg-white text-gray-400'; // Trắng
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setAlertDialog({
          isOpen: true,
          title: 'Lỗi',
          message: 'File phải là định dạng Excel (.xlsx hoặc .xls)',
          type: 'error'
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedProgramId) {
      setAlertDialog({
        isOpen: true,
        title: 'Lỗi',
        message: 'Vui lòng chọn file và chương trình đào tạo',
        type: 'error'
      });
      return;
    }

    setImporting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('program_id', selectedProgramId.toString());

      const response = await axios.post(
        `${API_URL}/api/clo-plo-mapping/import-excel`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setImportResult(response.data);
      setAlertDialog({
        isOpen: true,
        title: 'Thành công',
        message: `Import thành công! Đã xử lý ${response.data.courses_processed} môn học, tạo ${response.data.mappings_created} mapping mới, cập nhật ${response.data.mappings_updated} mapping.`,
        type: 'success'
      });

      // Refresh data
      await fetchData();
      
      // Reset form
      setSelectedFile(null);
      setSelectedProgramId(null);
      setShowImportDialog(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi không xác định';
      setAlertDialog({
        isOpen: true,
        title: 'Lỗi',
        message: `Lỗi khi import file: ${errorMessage}`,
        type: 'error'
      });
    } finally {
      setImporting(false);
    }
  };

  if (loading || autoSuggesting) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center">
          <p className="text-gray-600">
            {autoSuggesting ? 'Đang tự động gợi ý mapping...' : 'Đang tải...'}
          </p>
        </div>
      </div>
    );
  }

  if (clos.length === 0 || plos.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">
          {clos.length === 0 && 'Chưa có CLO. Tạo CLO trước.'}
          {plos.length === 0 && 'Chưa có PLO. Tạo PLO cho chương trình trước.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-xl font-semibold mb-2">Ma trận CLO-PLO</h2>
            <p className="text-sm text-gray-600 mb-4">
              Liên kết CLO (mục tiêu học tập của môn học) với PLO (chuẩn đầu ra của chương trình)
            </p>
          </div>
          <button
            onClick={() => setShowImportDialog(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
          >
            📥 Import từ Excel
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900 font-medium mb-2">📌 Hướng dẫn:</p>
          <p className="text-sm text-blue-800 mb-2">
            Hệ thống đã tự động tạo mapping CLO–PLO dựa trên thuật toán: <strong>Score = 0.6×K + 0.3×B + 0.1×H</strong>
            (K = từ khóa, B = Bloom level, H = từ khóa mạnh)
          </p>
          <p className="text-sm text-blue-800 mb-2">
            Click vào ô để thay đổi mức độ đóng góp. Chu kỳ: <strong>- → L → N → M → -</strong>
          </p>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li><strong>M (Đóng góp lớn):</strong> Đóng góp lớn vào PLO này (Score ≥ 0.70)</li>
            <li><strong>N (Đóng góp trung bình):</strong> Đóng góp trung bình vào PLO này (Score 0.45–0.69)</li>
            <li><strong>L (Đóng góp thấp):</strong> Đóng góp thấp vào PLO này (Score 0.20–0.44)</li>
            <li><strong>- (Không liên quan):</strong> Không liên quan (Score &lt; 0.20)</li>
          </ul>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2 bg-gray-100 text-left">CLO</th>
              {plos.map((plo) => (
                <th key={plo.id} className="border border-gray-300 p-2 bg-gray-100 text-center min-w-[80px]">
                  <div className="font-medium">{plo.code}</div>
                  <div className="text-xs text-gray-600 font-normal mt-1 max-w-[100px] truncate" title={plo.description}>
                    {plo.description.substring(0, 30)}...
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clos.map((clo) => (
              <tr key={clo.id}>
                <td className="border border-gray-300 p-2">
                  <div className="font-medium">{clo.displayCode || 'CLO'}</div>
                  <div className="text-xs text-gray-600">
                    {clo.verb} {clo.text}
                  </div>
                </td>
                {plos.map((plo) => {
                  const level = getContributionLevel(clo.id, plo.id);
                  return (
                    <td
                      key={plo.id}
                      className={`border border-gray-300 p-3 text-center cursor-pointer hover:opacity-80 font-semibold text-lg transition-all ${getCellStyle(level)}`}
                      onClick={() => cycleContributionLevel(clo.id, plo.id)}
                      title={getTooltip(level)}
                    >
                      {level || '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Import Mapping từ Excel</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn chương trình đào tạo:
              </label>
              <select
                value={selectedProgramId || ''}
                onChange={(e) => setSelectedProgramId(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">-- Chọn chương trình --</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.code} - {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn file Excel:
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Đã chọn: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-blue-900 mb-2">📋 Yêu cầu file Excel:</p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>Cột <strong>Mã học phần</strong> (hoặc Mã học, Code, Course Code)</li>
                <li>Cột <strong>Tên học phần</strong> (hoặc Tên học, Name, Course Name)</li>
                <li>Các cột <strong>PLO/ELO</strong> (ELO1, ELO2, ..., PLO1, PLO2, ...)</li>
                <li>Giá trị trong ô: <strong>H/M/A</strong> (Major), <strong>N/R</strong> (Neutral), <strong>S/L/I</strong> (Low), hoặc rỗng</li>
              </ul>
            </div>

            {importResult && (
              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Kết quả import:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Môn học đã xử lý: {importResult.courses_processed}</li>
                  <li>• Mapping mới: {importResult.mappings_created}</li>
                  <li>• Mapping cập nhật: {importResult.mappings_updated}</li>
                  {importResult.errors.length > 0 && (
                    <li className="text-red-600">
                      • Lỗi: {importResult.errors.length} lỗi
                      <details className="mt-2">
                        <summary className="cursor-pointer">Xem chi tiết lỗi</summary>
                        <ul className="list-disc list-inside mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {importResult.errors.map((error, idx) => (
                            <li key={idx} className="text-xs">{error}</li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setSelectedFile(null);
                  setSelectedProgramId(null);
                  setImportResult(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={importing}
              >
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedFile || !selectedProgramId || importing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Đang import...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ isOpen: false, title: '', message: '', type: 'info' })}
      />
    </div>
  );
};

export default CLOPLOMatrix;
