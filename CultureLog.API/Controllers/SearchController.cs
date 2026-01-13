using Microsoft.AspNetCore.Mvc;
using CultureLog.API.Services;
using CultureLog.API.Models;

namespace CultureLog.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly NaverSearchService _naverService;
        private readonly TmdbSearchService _tmdbService;
        private readonly RawgSearchService _rawgService; // [NEW] 게임 담당

        public SearchController(NaverSearchService naverService, TmdbSearchService tmdbService, RawgSearchService rawgService)
        {
            _naverService = naverService;
            _tmdbService = tmdbService;
            _rawgService = rawgService;
        }

        // [GET] 검색 (카테고리 파라미터 추가)
        // 사용법: api/Search/해리포터?category=movie
        [HttpGet("{query}")]
        public async Task<IActionResult> Search(string query, [FromQuery] string category = "all")
        {
            var results = new List<SearchResult>();

            try
            {
                // [NEW] "전체 검색"이면 모든 서비스 동시에 출발! (병렬 처리)
                if (category == "all")
                {
                    // 3개의 작업을 동시에 시작
                    var movieTask = _tmdbService.SearchAsync(query);
                    var bookTask = _naverService.SearchAsync(query); // 책+웹툰 포함
                    var gameTask = _rawgService.SearchAsync(query);

                    // 다 끝날 때까지 기다림 (가장 느린 녀석 기준)
                    await Task.WhenAll(movieTask, bookTask, gameTask);

                    // 결과 합치기
                    results.AddRange(movieTask.Result);
                    results.AddRange(bookTask.Result);
                    results.AddRange(gameTask.Result);

                    // (웹툰 분류 로직은 여기서 할 필요 없이 프론트가 해도 되지만, 
                    // 기존 로직 유지를 위해 네이버 결과 중 만화책은 webtoon으로 바꿔줄 수도 있음.
                    // 일단은 간단하게 섞어서 보냅니다.)
                }
                else
                {
                    // (특정 카테고리만 콕 집어 요청했을 때 - 기존 로직 유지)
                    if (category == "movie") results.AddRange(await _tmdbService.SearchAsync(query));
                    else if (category == "book") results.AddRange(await _naverService.SearchAsync(query));
                    else if (category == "game") results.AddRange(await _rawgService.SearchAsync(query));
                    else if (category == "webtoon")
                    {
                        var books = await _naverService.SearchAsync(query);
                        books.ForEach(r => r.Type = "webtoon");
                        results.AddRange(books);
                    }
                }

                return Ok(results);
            }
            catch (Exception ex)
            {
                // 에러 나도 죽지 말고 빈 리스트 반환 (혹은 에러 메시지)
                Console.WriteLine(ex.Message);
                return Ok(new List<SearchResult>());
            }
        }
    }
}




/*
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
*/

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