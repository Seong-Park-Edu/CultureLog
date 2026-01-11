using Microsoft.AspNetCore.Mvc;
using CultureLog.API.Services;
using CultureLog.API.Models;

// 일꾼 1명에서 여러 명으로 변경
namespace CultureLog.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        // 1. [변경] 한 명이 아니라 '여러 명'을 담을 리스트로 변경
        private readonly IEnumerable<ISearchService> _searchServices;

        // 2. [생성자 주입] "등록된 모든 ISearchService를 다 데려와 주세요"
        public SearchController(IEnumerable<ISearchService> searchServices)
        {
            _searchServices = searchServices;
        }

        [HttpGet("{query}")]
        public async Task<IActionResult> Search(string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return BadRequest();

            // 3. [병렬 처리] 모든 일꾼에게 동시에 "검색해!"라고 시킵니다.
            // Select: 각 일꾼에게 업무 지시
            var tasks = _searchServices.Select(service => service.SearchAsync(query));

            // WhenAll: 모든 일꾼이 돌아올 때까지 기다림 (동시에 일하므로 빠름!)
            var resultsArray = await Task.WhenAll(tasks);

            // 4. [결과 합치기] 
            // 현재 결과: [[영화1, 영화2], [책1, 책2]] 이런 식의 2중 리스트 상태
            // SelectMany: 이것을 [영화1, 영화2, 책1, 책2] 처럼 하나의 리스트로 쫙 펴줌
            var finalResults = resultsArray.SelectMany(r => r).ToList();

            return Ok(finalResults);
        }
    }
}

/*일꾼 1명 배치
namespace CultureLog.API.Controllers
{
    // 1. [ApiController]: "이 클래스는 화면(HTML) 말고 데이터(JSON)만 줍니다"라는 선언
    [ApiController]
    // 2. [Route]: 주소창에 'api/Search'라고 치면 이리로 오세요
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _searchService;

        // 3. [의존성 주입]: "일꾼(ISearchService) 좀 보내주세요."
        // Program.cs에 등록해둔 TmdbSearchService가 여기로 배달됩니다.
        public SearchController(ISearchService searchService)
        {
            _searchService = searchService;
        }

        // 4. [HttpGet]: GET 요청을 받음
        // 주소 예시: api/Search/아이언맨
        [HttpGet("{query}")]
        public async Task<IActionResult> Search(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("검색어를 입력해주세요.");
            }

            // 일꾼에게 시키기 (비동기 대기)
            var results = await _searchService.SearchAsync(query);

            // 결과 내보내기 (OK = 200 성공)
            return Ok(results);
        }
    }
}
*/