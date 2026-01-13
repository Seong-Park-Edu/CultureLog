using CultureLog.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace CultureLog.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentController : ControllerBase
    {
        private readonly Supabase.Client _supabaseClient;

        public CommentController(Supabase.Client supabaseClient)
        {
            _supabaseClient = supabaseClient;
        }

        // 1. 특정 글의 댓글 가져오기 (GET api/Comment/review/5)
        [HttpGet("review/{reviewId}")]
        public async Task<IActionResult> GetComments(long reviewId)
        {
            var response = await _supabaseClient
                .From<Comment>()
                .Where(c => c.ReviewId == reviewId)
                .Order("created_at", Supabase.Postgrest.Constants.Ordering.Ascending) // 옛날 댓글부터 순서대로
                .Get();

            return Ok(response.Models);
        }

        // 2. 댓글 쓰기 (POST api/Comment)
        [HttpPost]
        public async Task<IActionResult> AddComment([FromBody] Comment comment)
        {
            await _supabaseClient.From<Comment>().Insert(comment);
            return Ok();
        }

        // 3. 댓글 삭제 (DELETE api/Comment/123)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(long id)
        {
            await _supabaseClient.From<Comment>().Where(c => c.Id == id).Delete();
            return Ok();
        }
    }
}