using Microsoft.AspNetCore.Mvc;
using Supabase;
using Supabase.Postgrest;
using CultureLog.API.Models;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly Supabase.Client _supabaseClient;

    public DashboardController(Supabase.Client supabaseClient)
    {
        _supabaseClient = supabaseClient;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetMyStats([FromQuery] string userId)
    {
        if (string.IsNullOrEmpty(userId)) return BadRequest("유저 ID가 필요합니다.");

        // 1. 내 데이터만 가져오기 
        // 꿀팁: 통계만 낼 거니까 무거운 'Content' 같은 건 빼고 'Type', 'CreatedAt'만 가져오면 훨씬 빨라!
        var response = await _supabaseClient
            .From<Review>()
            .Select("id, type, created_at, rating") 
            .Filter("user_id", Supabase.Postgrest.Constants.Operator.Equals, userId)
            .Get();

        var reviews = response.Models;

        // 2. C# 메모리에서 계산하기 (LINQ 사용)
        var totalCount = reviews.Count;
        
        // 이번 달 기록 수 (오늘 날짜와 비교)
        var thisMonthCount = reviews.Count(r => 
            r.CreatedAt.Year == DateTime.Now.Year && 
            r.CreatedAt.Month == DateTime.Now.Month);

        // 카테고리별 분포 (Group By)
        var categoryDistribution = reviews
            .GroupBy(r => r.Type)
            .Select(g => new 
            { 
                Name = g.Key, 
                Value = g.Count() 
            })
            .ToList();

        // 3. 결과 포장해서 보내기
        return Ok(new
        {
            TotalCount = totalCount,
            ThisMonthCount = thisMonthCount,
            CategoryData = categoryDistribution
        });
    }
}