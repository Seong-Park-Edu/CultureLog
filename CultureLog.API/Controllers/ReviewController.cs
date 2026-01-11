using Microsoft.AspNetCore.Mvc;
using CultureLog.API.Models;

namespace CultureLog.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly Supabase.Client _supabaseClient;

        // [의존성 주입] Program.cs에서 등록한 Supabase 클라이언트를 받음
        public ReviewController(Supabase.Client supabaseClient)
        {
            _supabaseClient = supabaseClient;
        }

        // [POST] 감상문 저장 기능
        // 주소: api/Review
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] Review review)
        {
            // 1. 데이터 검증 (제목이 없으면 거절)
            if (string.IsNullOrWhiteSpace(review.Title))
            {
                return BadRequest("제목은 필수입니다.");
            }

            // 2. Supabase에 저장 (Insert)
            // C# 객체를 DB에 넣으면, 방금 생성된 데이터(ID 포함)를 다시 돌려줍니다.
            var response = await _supabaseClient.From<Review>().Insert(review);

            var newReview = response.Models.FirstOrDefault();

            // 3. 성공 메시지 반환
            if (newReview == null) return BadRequest("저장 실패");

            // "순수한 데이터"만 골라서 보냅니다.
            return Ok(new
            {
                Id = newReview.Id,
                Title = newReview.Title,
                ImageUrl = newReview.ImageUrl,
                Type = newReview.Type,
                ExternalId = newReview.ExternalId,
                ReviewContent = newReview.ReviewContent,
                Rating = newReview.Rating,
                IsPublic = newReview.IsPublic,
                CreatedAt = newReview.CreatedAt
            });
        }

        // [GET] 내 서재 목록 조회
        // 주소: api/Review
        [HttpGet]
        public async Task<IActionResult> GetReviews()
        {
            // 1. Supabase에서 데이터 가져오기 (작성일 기준 최신순 정렬)
            var response = await _supabaseClient
                .From<Review>()
                .Order("created_at", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            var reviews = response.Models;

            // 2. 안전하게 데이터 포장하기 (아까 그 에러 방지!)
            var result = reviews.Select(r => new
            {
                Id = r.Id,
                Title = r.Title,
                ImageUrl = r.ImageUrl,
                Type = r.Type,
                ReviewContent = r.ReviewContent,
                Rating = r.Rating,
                CreatedAt = r.CreatedAt
            });

            return Ok(result);
        }

        // [DELETE] 감상문 삭제 기능
        // 주소예시: api/Review/5  <-- 5번 글을 지워라!
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(long id)
        {
            // Supabase에서 id가 똑같은 녀석을 찾아서 삭제(Delete)
            await _supabaseClient
                .From<Review>()
                .Where(x => x.Id == id)
                .Delete();

            return Ok(); // "삭제 성공!" 응답 보냄
        }

    }
}