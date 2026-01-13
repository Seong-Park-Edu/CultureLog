// src/Dashboard.jsx
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard({ session }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;
  
  // 차트 색상 (파랑, 민트, 노랑, 주황, 보라)
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // 통계 데이터 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      if (!session) return;
      
      try {
        setLoading(true);
        // 백엔드: DashboardController의 /stats 엔드포인트 호출
        const response = await fetch(`${API_URL}/api/Dashboard/stats?userId=${session.user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error("통계 불러오기 실패");
        }
      } catch (error) {
        console.error("에러 발생:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, API_URL]);

  // 로딩 중일 때
  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>데이터 분석 중... 📊</div>;

  // 데이터가 없을 때
  if (!stats) return <div style={{ textAlign: 'center', padding: '50px' }}>데이터를 불러올 수 없습니다.</div>;

  return (
    <div style={{ padding: "20px", animation: "fadeIn 0.5s" }}>
      
      {/* 1. 핵심 요약 카드 (Summary Cards) */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "40px", flexWrap: "wrap" }}>
        {/* 총 기록 카드 */}
        <div style={{ flex: 1, minWidth: "150px", padding: "20px", background: "#f0f8ff", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>총 기록</h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: "10px 0", color: "#007AFF" }}>
            {stats.totalCount || 0}개
          </p>
        </div>
        
        {/* 이번 달 카드 */}
        <div style={{ flex: 1, minWidth: "150px", padding: "20px", background: "#fff0f6", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>이번 달 활동</h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: "10px 0", color: "#e91e63" }}>
            {stats.thisMonthCount || 0}개
          </p>
        </div>
      </div>

      {/* 2. 차트 섹션 */}
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee" }}>
        <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>나의 문화 취향 분포</h3>
        
        {stats.totalCount === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '50px' }}>
            아직 기록이 없어요.<br/>첫 번째 기록을 남겨보세요! ✍️
          </p>
        ) : (
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats.categoryData} // 백엔드에서 받은 { name: 'movie', value: 5 } 배열
                  cx="50%"
                  cy="50%"
                  innerRadius={60} // 도넛 모양
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. 문구 추천 (재미 요소) */}
      <div style={{ marginTop: "30px", textAlign: "center", fontSize: "14px", color: "#888" }}>
        {stats.thisMonthCount > 0 
          ? "이번 달도 문화 생활로 가득 찼네요! 👏" 
          : "이번 달은 어떤 작품을 만나게 될까요? 👀"}
      </div>

    </div>
  );
}

export default Dashboard;