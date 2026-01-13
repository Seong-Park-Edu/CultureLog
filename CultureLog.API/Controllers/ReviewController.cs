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
            review.CreatedAt = DateTime.Now;
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

        // [GET] 목록 조회 (필터링 추가)
        // 사용법: api/Review?userId=내아이디
        [HttpGet]
        public async Task<IActionResult> GetReviews(
            [FromQuery] string? userId,
            [FromQuery] int page = 1,      // [추가] 몇 번째 페이지인지
            [FromQuery] int pageSize = 10  // [추가] 몇 개 가져올지
        )
        {
            var response = await _supabaseClient
                .From<Review>()
                .Order("created_at", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            var allReviews = response.Models;

            // [NEW] 필터링 로직 (소프트웨어적 처리)
            // 1. 공개(is_public = true)인 글은 누구나 봄
            // 2. 비공개 글은 작성자(userId)가 '나'와 같을 때만 봄
            var filteredReviews = allReviews.Where(r =>
                r.IsPublic == true || (userId != null && r.UserId == userId)
            );

            // ---------------------------------------------------------
            // 3. [★ 여기가 추가된 부분] 페이지네이션 (자르기)
            // ---------------------------------------------------------
            // 전체 리스트 중에서 (현재 페이지 - 1) * 10개만큼 건너뛰고(Skip)
            // 그 다음 10개만 가져옵니다(Take).
            var paginatedReviews = filteredReviews
                .Skip((page - 1) * pageSize)
                .Take(pageSize);
            // ---------------------------------------------------------

            // [★해결 핵심] 3. 안전한 데이터로 포장하기 (DTO 변환)
            // Supabase의 복잡한 속성을 떼어내고 순수 데이터만 담습니다.
            var result = filteredReviews.Select(r => new
            {
                Id = r.Id,
                Title = r.Title,
                ImageUrl = r.ImageUrl,
                Type = r.Type,
                ReviewContent = r.ReviewContent,
                Rating = r.Rating,
                CreatedAt = r.CreatedAt,
                IsPublic = r.IsPublic, // [NEW] 프론트에서 자물쇠 보여주려면 필요함
                UserId = r.UserId,      // [NEW] 프론트에서 수정 권한 체크하려면 필요함
                Author = r.Author, // [NEW] 작가 정보도 꺼내주기
            });

            return Ok(result);
        }

        // (CreateReview랑 UpdateReview는 나중에 프론트에서 보낸 값을 그대로 저장하므로 수정 불필요)

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

        // [PUT] 감상평 수정 기능
        // 주소예시: api/Review/5 (Body에 수정할 내용)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReview(long id, [FromBody] Review updatedData)
        {
            // 1. Supabase에서 id로 기존 글 찾기
            var model = await _supabaseClient
                .From<Review>()
                .Where(x => x.Id == id)
                .Single();

            if (model == null)
            {
                return NotFound(); // "그런 글 없는데요?"
            }

            // 2. 내용 갈아끼우기 (별점과 내용만 수정 가능하게)
            model.ReviewContent = updatedData.ReviewContent;
            model.Rating = updatedData.Rating;

            // 3. 저장!
            await model.Update<Review>();

            return Ok();
        }

    }
}