1. API 키 발급

2. 바탕화면에 프로젝트 폴더 생성

3. .NET SDK 다운로드 및 설치 (실제로 C# 코드를 실행하고 프로젝트를 만들어주는 **'엔진'**)

4. 터미널에 "dotnet --version" 입력해서 설치 확인

5. 터미널에 dotnet new webapi -n CultureLog.API (dotnet new: "새로운 거 만들어줘", webapi: "웹 API(데이터 전용 서버) 템플릿으로", -n CultureLog.API: "이름은 CultureLog.API로 해줘" (백엔드임을 명확히 하기 위해 .API를 붙였습니다))

6. appsettings.Development.json에 API key 넣기

7. cd CultureLog.API && dotnet run (서버 시동 걸기 - test)

8. CultureLog.API 폴더 안에 아래 3개의 새 폴더를 만들어주세요. (VS Code 탐색기 빈 공간 우클릭 -> New Folder)

    📂 Models: 데이터의 생김새(설계도)를 넣을 곳입니다. `그릇` (예: "검색 결과는 이렇게 생겼다")

    📂 Services: 실제 로직(외부 API 통신)을 담당하는 `일꾼`들이 지낼 곳입니다.

    📂 Controllers: 외부 요청을 받는 카운터입니다. (아까 지웠으니 다시 만들어야죠!)

9. 데이터 설계도(그릇) 만들기
    가장 먼저 할 일은 "검색 결과가 어떻게 생겼는지" 정의하는 것입니다. 
    영화든 책이든 공통적으로 필요한 정보(제목, 이미지 등)만 추려서 담을 **택배 박스(DTO)**를 만들겠습니다.
    Models 폴더 안에 SearchResult.cs 라는 파일을 만듭니다.
        코드 설명 (소프트웨어적 관점)
        namespace CultureLog.API.Models:

        주소지 설정: "이 파일은 CultureLog.API 건물의 Models 방에 있습니다"라고 선언하는 것입니다.

        public class SearchResult:

        설계도 선언: "지금부터 SearchResult라는 이름의 데이터 틀을 정의합니다."

        { get; set; }:

        자동 구현 프로퍼티: 변수를 읽고(get) 쓰는(set) 기능을 자동으로 만들어줍니다. C#에서 데이터를 담을 때 쓰는 기본 문법입니다.

        = string.Empty;:

        기본값: "처음 만들어질 때 텅 빈 문자열("")로 시작해라." (에러 방지용)

        string? (물음표):

        Nullable: "이 값은 비어있을 수도 있어." (옛날 책이나 영화는 포스터나 날짜가 없을 수도 있으니까요!)

10. 작업 지시서(일꾼) 만들기 (ISearchService.cs)
    먼저, 영화 담당자든 책 담당자든 "검색해와!" 라고 시키면 똑같이 알아들을 수 있도록 공통 규격(인터페이스)을 만듭니다.

    Services 폴더 안에 ISearchService.cs 파일을 만듭니다.

11. 영화 담당 일꾼 고용하기 (TmdbSearchService.cs)
    이제 인터페이스를 구현하는 진짜 일꾼을 만듭니다. 이 친구는 TMDB API와 대화하는 법을 알고 있습니다.

    Services 폴더 안에 TmdbSearchService.cs 파일을 만듭니다.

        핵심 문법 설명 =>
        IConfiguration config:

        역할: 비밀 금고(appsettings.json) 관리인입니다.

        코드: config["ApiKeys:Tmdb"]라고 하면, JSON 파일의 구조를 따라서 값을 쏙 꺼내옵니다. 아주 편리하죠?

        HttpClient:

        역할: C#에서 인터넷 브라우저 역할을 하는 도구입니다. 다른 서버(TMDB)에 요청을 보냅니다.

        JsonNode.Parse:

        TMDB가 보내주는 데이터는 아주 복잡한 문자열(JSON)입니다. 이걸 우리가 다루기 쉽게 '객체'로 바꿔주는 기능입니다.

12. 일꾼 등록하기 (Program.cs)
    일꾼(TmdbSearchService)을 만들었지만, 아직 고용 계약서를 안 썼습니다. Program.cs에 등록해줘야 다른 곳(컨트롤러)에서 이 일꾼을 부려먹을 수 있습니다.

    Program.cs 파일을 엽니다.

    var builder = WebApplication.CreateBuilder(args); 바로 밑 공간에 아래 코드를 추가합니다.

        // [기존 코드]
        var builder = WebApplication.CreateBuilder(args);

        // [추가할 코드 Start] -------------------------------

        // 1. HttpClient 사용 등록 (전화기 개통)
        builder.Services.AddHttpClient();

        // 2. 의존성 주입 등록 (DI)
        // "누가 ISearchService 달라고 하면 TmdbSearchService를 줘라!"
        // Scoped: 요청 한 번당 하나씩 만듦
        builder.Services.AddScoped<CultureLog.API.Services.ISearchService, CultureLog.API.Services.TmdbSearchService>();

        // [추가할 코드 End] ---------------------------------

        // [기존 코드]
        builder.Services.AddControllers();

------지금까지 만든 설계도(Model), 작업 지시서(Interface), **일꾼(Service)**을 활용해서, 손님의 주문을 받는 **지배인(Controller)**을 배치

13. 카운터 만들기 (SearchController.cs)
    Controllers 폴더 안에 SearchController.cs 파일을 만듭니다.
        🔍 코드 해부 (우리가 배운 것 총집합)
        ControllerBase:
        API 서버를 만들 때는 Controller보다 더 가벼운 ControllerBase를 상속받는 것이 국룰입니다. (View 기능이 빠져있음)

        public SearchController(ISearchService searchService):
        핵심! 여기서 우리는 TmdbSearchService를 직접 new 하지 않았습니다.
        인터페이스(ISearchService)로 달라고 했더니, ASP.NET이 알아서 Tmdb 구현체를 넣어줍니다. 나중에 네이버로 바꾸고 싶으면 여기는 건들 필요도 없습니다.

        [HttpGet("{query}")]:
        URL 경로의 일부를 변수처럼 쓰는 방식입니다.
        /api/Search/슬램덩크라고 요청하면 query 변수에 "슬램덩크"가 쏙 들어갑니다.

14. 대망의 실행 및 테스트!
    **터미널(Terminal)**에서 서버를 켭니다. (이미 켜져 있다면 껐다 켜주세요)
    cd CultureLog.API
    dotnet run
    Swagger 페이지로 이동합니다.

    http://localhost:5xxx/swagger (포트 번호 확인!)

    Swagger에서 검색해보기

    화면에 Search 라는 새로운 메뉴가 생겼을 겁니다!

    GET /api/Search/{query} 라고 적힌 파란색 줄을 클릭합니다.

    오른쪽의 [Try it out] 버튼을 누릅니다.

    query 칸에 좋아하는 영화 제목을 입력하세요. (예: 아이언맨, 범죄도시, 해리포터)

    파란색 [Execute] 버튼을 클릭!

15. 오류 발생. swagger ui 도구 설치해야 함.
     cd CultureLog.API
     dotnet add package Swashbuckle.AspNetCore

16. Program.cs 파일 완전 교체
    using CultureLog.API.Services;

    var builder = WebApplication.CreateBuilder(args);

    // [1] 서비스 등록 (재료 준비)
    // ---------------------------------------------------------

    // 1. 컨트롤러 기능 켜기 (이게 있어야 Controllers 폴더를 인식합니다!)
    builder.Services.AddControllers();

    // 2. Swagger(API 문서) 생성 도구 등록
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    // 3. HttpClient 등록
    builder.Services.AddHttpClient();

    // 4. 우리가 만든 검색 일꾼(Service) 등록
    builder.Services.AddScoped<ISearchService, TmdbSearchService>();

    // ---------------------------------------------------------

    var app = builder.Build();

    // [2] 파이프라인 설정 (손님 응대 순서)
    // ---------------------------------------------------------

    if (app.Environment.IsDevelopment())
    {
        // 개발 모드일 때 Swagger 화면을 켜라
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();

    app.UseAuthorization();

    // [중요] 컨트롤러들을 주소와 연결해라 (이게 핵심!)
    app.MapControllers();

    app.Run();

17. 14번으로 회귀해서 테스트 => 잘 됨.

18. "부품 갈아끼우기" (네이버 도서 검색)
    이제 아까 받아둔 네이버 API 키를 쓸 차례입니다. 여기서 **인터페이스(ISearchService)와 의존성 주입(DI)**의 진정한 마법을 보여드릴게요.

    우리는 SearchController(카운터) 코드를 단 한 줄도 수정하지 않고, 검색 엔진을 영화(TMDB)에서 책(Naver)으로 감쪽같이 바꿔치기할 겁니다.

    이게 바로 **"객체지향의 꽃(Polymorphism)"**입니다.

19. 책 검색 일꾼 만들기 (NaverSearchService.cs)
    영화 담당자와 똑같은 규격(ISearchService)을 가진 책 담당자를 만듭니다.

    Services 폴더 안에 NaverSearchService.cs 파일을 만듭니다.

20. 일꾼 교체하기 (Program.cs)
    이제 **Program.cs**로 가서 지시 사항을 딱 한 줄만 고치면 됩니다.

    Program.cs 파일을 엽니다.

    아까 작성한 builder.Services.AddScoped... 부분을 찾아서 아래처럼 수정하세요.

        // [기존 코드]
        builder.Services.AddHttpClient();

        // ▼▼▼ [수정할 부분] ▼▼▼

        // 1. 기존 TMDB 일꾼은 잠시 주석 처리 (//)
        // builder.Services.AddScoped<ISearchService, TmdbSearchService>();

        // 2. 새로운 네이버 일꾼으로 교체!
        builder.Services.AddScoped<ISearchService, NaverSearchService>();

        // ▲▲▲ ---------------- ▲▲▲

21. 마법 확인하기 🎩
    자, 우리는 SearchController를 건드리지 않았습니다. 하지만 이제 서버를 켜고 검색하면 책이 검색될 겁니다.

    터미널에서 Ctrl + C (서버 끄기) -> dotnet run (서버 켜기).

    Swagger 페이지 새로고침.

    Search 기능에서 **"해리포터"**나 **"어린왕자"**를 검색해 보세요.

    결과 Type이 "Book"으로 나오고, 책 표지 이미지가 뜨나요?

22. 이게 왜 중요한가요?
    이것이 바로 **"의존성 주입(DI)을 쓰는 이유"**입니다. SearchController는 "누가 검색해오든 난 몰라, 난 그냥 ISearchService한테 시키기만 할 거야"라고 맹세했기 때문에, Program.cs에서 부품만 툭 갈아 끼우면 시스템 전체가 영화 검색기에서 도서 검색기로 변신하는 것입니다.

    책 검색이 잘 되나요? 확인되시면 이제 "영화랑 책 둘 다 동시에 검색하려면 어떻게 해요?" 라는 질문이 생기실 겁니다. 그 방법도 알려드릴까요?

23. 영화와 책 동시에 검색하기
    이 기능을 구현하는 방법은 의외로 간단합니다. 지금까지 우리는 컨트롤러에서 **"일꾼(ISearchService) 한 명만 보내주세요"**라고 요청했습니다. 이걸 **"일꾼 팀(IEnumerable)을 통째로 보내주세요"**라고 요청만 바꾸면 됩니다.

    그러면 ASP.NET이 알아서 등록된 모든 일꾼(TMDB, Naver)을 바구니에 담아서 가져다줍니다.

24. 일꾼 모두 등록하기 (Program.cs)
    일단 인력 사무소(Program.cs)에 두 일꾼을 모두 출근시켜야 합니다. 주석 처리했던 걸 풀어서 둘 다 등록해 주세요.

    // Program.cs 수정

    builder.Services.AddHttpClient();

    // [중요] 인터페이스는 똑같지만, 구현체가 다른 두 녀석을 모두 등록합니다.
    builder.Services.AddScoped<ISearchService, TmdbSearchService>();
    builder.Services.AddScoped<ISearchService, NaverSearchService>();

25. 카운터에서 팀으로 받기 (SearchController.cs)
    이제 지배인(SearchController)이 일꾼을 받는 방식을 바꿉니다.

    변경 전: ISearchService (일꾼 한 명)

    변경 후: IEnumerable<ISearchService> (일꾼 리스트)

    코드를 아래와 같이 수정해 주세요. (기존 코드를 지우고 덮어쓰세요)

        using Microsoft.AspNetCore.Mvc;
        using CultureLog.API.Services;
        using CultureLog.API.Models;

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

26. 25의 🔍 핵심 기술: Task.WhenAll (비동기의 마법)
    여기서 아주 중요한 성능 최적화 기술이 들어갔습니다.

    나쁜 방법 (순차 처리):

    TMDB한테 갔다 와. (1초)

    그다음 네이버한테 갔다 와. (1초)

    총 2초 걸림.

    좋은 방법 (병렬 처리 - Task.WhenAll):

    TMDB랑 네이버, 동시에 출발해!

    둘 중 늦게 오는 녀석 기준으로 끝남. (1초)

    총 1초 걸림.

27. 저장 후 서버 재시작 (Ctrl + C -> dotnet run).

    Swagger에서 Search 기능 실행.

    **"해리포터"**를 검색해 보세요.

    결과 목록에 Movie 타입의 해리포터와 Book 타입의 해리포터가 섞여서 나오나요? 이것이 바로 통합 검색입니다! 😎

28. DB만들기 
    
    1단계: SQL 에디터 열기
    Supabase 대시보드 (supabase.com)에 접속해서 프로젝트를 클릭합니다.

    왼쪽 메뉴바에서 [ SQL Editor ] (아이콘: >_ 모양)를 클릭합니다.

    상단의 [ New query ] 버튼을 눌러 빈 페이지를 엽니다.

    2단계: 테이블 생성 주문서 넣기
    아래 코드를 복사해서 에디터 화면에 그대로 붙여넣으세요. (우리가 기획했던 Reviews 테이블의 완벽한 설계도입니다.)

    SQL

        -- 1. 기존에 같은 이름이 있으면 삭제하고 다시 만듦 (초기화용)
        drop table if exists public.reviews;

        -- 2. Reviews 테이블 생성
        create table public.reviews (
        id bigint generated by default as identity primary key, -- 고유 번호 (자동 생성)
        created_at timestamp with time zone default timezone('utc'::text, now()) not null, -- 작성일
        
        -- 저장할 데이터들
        title text not null,        -- 제목 (예: 해리포터)
        image_url text,             -- 포스터 이미지
        type text not null,         -- 종류 (Movie, Book)
        external_id text,           -- 원본 ID (TMDB ID, ISBN 등)
        
        review_content text,        -- 감상평 내용
        rating smallint,            -- 별점 (1~5)
        is_public boolean default true -- 공개 여부 (기본값: 공개)
        );

        -- 3. (중요) RLS(보안 정책) 잠시 끄기
        -- 지금은 로그인 기능 없이 테스트할 거라 보안 문을 열어둬야 에러가 안 납니다.
        alter table public.reviews disable row level security;
    3단계: 실행 (Run)
    우측 하단의 [ Run ] 버튼(또는 Ctrl + Enter)을 누릅니다.

    하단 결과창에 Success 또는 No rows returned라고 뜨면 성공입니다!

29. ASP.NET 서버에서 이 창고까지 고속도로를 뚫기
    1단계: 통역사(라이브러리) 설치
        터미널을 열고(꼭 CultureLog.API 폴더인지 확인하세요!) 아래 명령어를 입력해서 설치합니다.

        dotnet add package Supabase

    2단계: 연결 정보(비밀 열쇠) 가져오기
        Supabase 대시보드에서 우리 집 주소(URL)와 열쇠(Key)를 알아와야 합니다.

        Supabase 대시보드 왼쪽 메뉴 하단에 [ Project Settings ] (톱니바퀴 아이콘) 클릭.

        [ Data API ] 메뉴 클릭.
        Project URL에 있는 주소를 복사합니다.

        [ API Keys ] 메뉴 클릭.
        Project API keys에 있는 anon / public 키를 복사합니다. (절대 service_role 키는 쓰지 마세요!)
    
    3단계: 비밀 금고(appsettings.Development.json)에 저장
        복사한 정보를 VS Code의 appsettings.Development.json 파일에 저장합니다. (기존 ApiKeys 밑에 추가하면 됩니다.)
        {
            "Logging": {
                "LogLevel": {
                "Default": "Information",
                "Microsoft.AspNetCore": "Warning"
                }
            },
            "AllowedHosts": "*",
            "ApiKeys": {
                "Tmdb": "기존_TMDB_키",
                "NaverClientId": "기존_네이버_ID",
                "NaverClientSecret": "기존_네이버_시크릿",
                
                // ▼▼▼ 여기 추가하세요 ▼▼▼
                "SupabaseUrl": "여기에_Supabase_URL_붙여넣기",
                "SupabaseKey": "여기에_Supabase_ANON_KEY_붙여넣기"
              }
        }
    4단계: 연결 코드 작성 (Program.cs)
        이제 서버가 켜질 때 Supabase에 로그인하도록 설정합니다.

        Program.cs 파일을 엽니다.

        builder.Services.AddHttpClient(); 근처에 아래 코드를 추가합니다.

            // [기존 코드]
            builder.Services.AddHttpClient();

            // ▼▼▼ [Supabase 연결 설정 추가] ▼▼▼
            builder.Services.AddScoped<Supabase.Client>(provider => 
            {
                var config = provider.GetRequiredService<IConfiguration>();
                var url = config["ApiKeys:SupabaseUrl"]!;
                var key = config["ApiKeys:SupabaseKey"]!;

                // Supabase 옵션 설정
                var options = new Supabase.SupabaseOptions
                {
                    AutoRefreshToken = true,
                    AutoConnectRealtime = true
                };

                // 클라이언트 생성 및 초기화
                var client = new Supabase.Client(url, key, options);
                client.InitializeAsync().Wait(); // 연결될 때까지 잠시 대기

                return client;
            });
            // ▲▲▲ ----------------------- ▲▲▲

            // [기존 코드]
            builder.Services.AddScoped<ISearchService, TmdbSearchService>();

    이제 **"고속도로 개통"**은 끝났습니다!

30. "감상문 저장(Create)" 기능을 만들어보겠습니다.

    이 과정은 ASP.NET 서버가 중간에서 택배 기사 역할을 하는 것과 같습니다.

    **React(손님)**가 감상문 박스를 서버에 줍니다.

    **ASP.NET(기사)**이 박스를 받아서 내용물이 깨지지 않았나 확인합니다.

    **Supabase(물류창고)**에 박스를 집어넣습니다.

        1단계: 데이터 포장지 만들기 (Review.cs)
            C# 코드와 Supabase 테이블을 서로 연결해 주는 매핑(Mapping) 작업입니다. "C#의 Title은 DB의 title 컬럼이야!"라고 알려주는 명찰을 붙이는 겁니다.

            Models 폴더 안에 Review.cs 파일을 만듭니다.

            주의: [Table("reviews")] 처럼 대괄호 안에 있는 게 실제 DB 테이블 이름입니다.

        2단계: 저장 담당 카운터 만들기 (ReviewController.cs)
            이제 "저장해줘(POST)" 요청을 받아서 실제로 DB에 넣는 컨트롤러를 만듭니다.

            Controllers 폴더 안에 ReviewController.cs 파일을 만듭니다.

31. 🚀 대망의 저장 테스트 (Swagger)
    코드는 끝났습니다! 이제 진짜 DB에 저장이 되는지 확인해 볼까요?

    서버 재시작: 터미널 Ctrl + C -> dotnet run.

    Swagger 접속: http://localhost:5194/swagger.

    Review 메뉴 확인: POST /api/Review 라는 초록색 버튼이 생겼을 겁니다.

    Try it out 클릭.

    Request body 칸에 아래 내용을 복사해서 붙여넣으세요. (테스트용 가짜 데이터)

        {
        "title": "아이언맨 1",
        "imageUrl": "https://image.tmdb.org/t/p/w200/....jpg",
        "type": "Movie",
        "externalId": "1726",
        "reviewContent": "진짜 내 인생 최고의 영화... 로다주 사랑해요",
        "rating": 5,
        "isPublic": true
        }

32. 오류 발생. 
    dotnet add package postgrest-csharp
    dotnet restore
    dotnet run

    해도 안 됨.

    Review.cs 파일의 using을 아래처럼 수정함. (Ctrl + . 누름)
        using Supabase.Postgrest.Attributes; // Supabase용 명찰
        using Supabase.Postgrest.Models;     // Supabase 기본 모델
    
    성공

33. 프론트 짜기 (새 창에서 실행)
    지금 켜져 있는 VS Code(백엔드)는 절대 끄지 마세요. 서버가 켜져 있어야 나중에 연결할 수 있습니다. 작업의 혼동을 막기 위해 새로운 VS Code 창을 하나 더 엽니다.

    VS Code 메뉴: File -> New Window (또는 Ctrl + Shift + N)

    새 창에서: File -> Open Folder -> 바탕화면의 CultureLog 폴더 (가장 바깥 폴더)를 선택합니다.

    1단계: React 프로젝트 생성 (Vite 사용)
        요즘은 React를 만들 때 **Vite(비트)**라는 도구를 씁니다. 아주 빠르고 가볍거든요. 터미널을 열고(Ctrl + J), 아래 명령어를 입력하세요.

        1. 터미널이 CultureLog 폴더인지 확인하고 입력:

        npm create vite@latest CultureLog.Web -- --template react
        (중간에 Ok to proceed? (y)라고 물으면 y 누르고 엔터!)

        설명:

        CultureLog.Web: 프로젝트 이름입니다. (API랑 구분하기 위해 Web이라고 지음)

        --template react: 리액트용 템플릿으로 만들어라.

34. 내 화면 짜기
    1단계: 스타일 초기화 (CSS 비우기)
        예제에 포함된 디자인이 우리가 만들 디자인을 방해하지 않게 내용을 다 지워버리겠습니다.

        VS Code(프론트엔드 창) 왼쪽 탐색기에서 src 폴더를 펼칩니다.

        App.css 파일을 클릭합니다 -> 내용을 **전부 지우고 저장(Ctrl+S)**하세요. (파일 자체를 삭제하는 게 아니라, 내용만 백지로 만드는 겁니다!)

        index.css 파일을 클릭합니다 -> 역시 내용을 전부 지우고 저장하세요.
    
    2단계: 메인 화면 교체 (App.jsx)
        이제 실제 화면 구성을 담당하는 코드를 수정합니다.

        App.jsx 파일을 클릭합니다.

        기존 내용을 다 지우고, 아래 코드를 복사해서 붙여넣으세요.  

            // App.jsx
            function App() {
            return (
                <div style={{ padding: "20px" }}>
                <h1>🎬 내 문화생활 기록장</h1>
                <p>여기에 검색 기능을 만들 거예요!</p>
                </div>
            );
            }

        export default App;
        팁: .jsx는 **자바스크립트(JS)**와 **HTML(마크업)**을 섞어 쓸 수 있는 리액트 전용 파일입니다.

    3단계: 확인하기 (자동 반영)
        브라우저를 다시 보세요. (새로고침 안 해도 됩니다. 리액트는 저장하자마자 바로 반영해주거든요!)

        화면에 빙글빙글 도는 로고가 사라지고, 아래 글자만 깔끔하게 남았나요?

35. 화면 요소 만들기
    1단계: 검색창 만들기 (App.jsx)
        🔍 코드 설명 (핵심!)
        useState(""): 리액트한테 "나 텍스트 저장할 공간 하나 줘"라고 요청하는 겁니다.

        onChange: 사용자가 키보드를 칠 때마다 그 값을 가로채서 query 변수에 실시간으로 업데이트합니다. 이게 없으면 타이핑이 안 됩니다!
    
    2단계: 테스트
        브라우저 화면을 보세요.

        검색창에 **"아이언맨"**이라고 써지나요?

        [검색] 버튼을 누르거나 엔터를 쳤을 때, 화면 위에 **알림창(Alert)**이 뜨나요?

        검색 버튼 클릭됨! 입력한 값: 아이언맨

36. 프론트와 백 연결
    웹 브라우저는 보안상의 이유로 **"다른 주소(포트)"**에 있는 서버와 통신하는 걸 기본적으로 차단합니다.

    프론트엔드: localhost:5173

    백엔드: localhost:5194 (번호가 다름!)

    백엔드 서버에서 "5173번 손님은 들어와도 돼!" 라고 허락해 주는 설정(CORS, 교차 출처 리소스 공유)을 먼저 해줘야 합니다.

37. 1단계: 백엔드 서버 설정 (Program.cs)
    다시 백엔드 VS Code 창으로 돌아가세요. (CultureLog.API)

    Program.cs 파일을 엽니다.
    내용을 아래 코드로 완전히 덮어씌워 주세요. (CORS 설정이 추가된 버전입니다.)
        using CultureLog.API.Services;

        var builder = WebApplication.CreateBuilder(args);

        // [1] 서비스 등록 (재료 준비)
        // ---------------------------------------------------------

        // 1. 컨트롤러 기능 켜기 (이게 있어야 Controllers 폴더를 인식합니다!)
        builder.Services.AddControllers();

        // 2. Swagger(API 문서) 생성 도구 등록
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        // 3. HttpClient 등록
        builder.Services.AddHttpClient();

        // 7. ▼▼▼ [중요] CORS 설정 추가: "리액트(5173)의 접근을 허용한다" ▼▼▼
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowReact", policy =>
            {
                policy.WithOrigins("http://localhost:5173") // 리액트 주소
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });
        // ▲▲▲ ---------------------------------------------------- ▲▲▲

        // 6. ▼▼▼ [Supabase 연결 설정 추가] ▼▼▼
        builder.Services.AddScoped<Supabase.Client>(provider =>
        {
            var config = provider.GetRequiredService<IConfiguration>();
            var url = config["ApiKeys:SupabaseUrl"]!;
            var key = config["ApiKeys:SupabaseKey"]!;

            // Supabase 옵션 설정
            var options = new Supabase.SupabaseOptions
            {
                AutoRefreshToken = true,
                AutoConnectRealtime = true
            };

            // 클라이언트 생성 및 초기화
            var client = new Supabase.Client(url, key, options);
            client.InitializeAsync().Wait(); // 연결될 때까지 잠시 대기

            return client;
        });
        // ▲▲▲ ----------------------- ▲▲▲

        // 4. 우리가 만든 검색 일꾼(Service) 등록
        builder.Services.AddScoped<ISearchService, TmdbSearchService>();

        // 5. 새로운 네이버 일꾼도 등록!
        builder.Services.AddScoped<ISearchService, NaverSearchService>();

        // ---------------------------------------------------------

        var app = builder.Build();

        // [2] 파이프라인 설정 (손님 응대 순서)
        // ---------------------------------------------------------

        if (app.Environment.IsDevelopment())
        {
            // 개발 모드일 때 Swagger 화면을 켜라
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        // ▼▼▼ [중요] CORS 정책 적용 (순서 중요! UseAuthorization 위에 있어야 함) ▼▼▼
        app.UseCors("AllowReact");
        // ▲▲▲ ---------------------------------------------------------------- ▲▲▲

        app.UseHttpsRedirection();

        app.UseAuthorization();

        // [중요] 컨트롤러들을 주소와 연결해라 (이게 핵심!)
        app.MapControllers();

        app.Run();

    2단계: 백엔드 서버 재시작
        설정을 바꿨으니 서버를 껐다 켜야 적용됩니다.

        Ctrl + C (끄기).

        dotnet run (켜기).

        터미널에 뜬 주소(http://localhost:XXXX)의 포트 번호를 잘 외워두세요! (보통 5194 또는 5xxx)

    3단계: 프론트엔드에서 데이터 가져오기 (App.jsx)
        이제 프론트엔드 VS Code 창으로 돌아오세요. App.jsx를 수정해서, 버튼을 누르면 진짜로 데이터를 가져오게 만듭니다.

        App.jsx 파일을 엽니다.

        아래 코드로 덮어씌웁니다. (생략)

        주의: 코드 중간에 fetch('http://localhost:5194/api/Search/'... 부분의 **포트 번호(5194)**를 아까 백엔드 터미널에 뜬 번호와 일치시켜주세요!

    🚀 최종 테스트
        브라우저를 엽니다 (http://localhost:5173).

        "해리포터" 또는 **"아이언맨"**을 입력하고 검색 버튼을 누르세요.

        화면에 포스터들이 와라락 쏟아지나요?

        성공하셨다면 알려주세요! 정말 멋진 장면일 겁니다. 😎 (만약 아무 반응이 없거나 에러가 나면, F12를 눌러 Console 탭의 빨간 글씨를 보여주세요.)

38. 내 감상평과 함께 데이터베이스에 영구 저장하는 기능
    1단계: 저장 기능 추가하기 (App.jsx)
        **프론트엔드 VS Code(CultureLog.Web)**에서 App.jsx 코드를 아래 내용으로 바꿔주세요.

        [추가된 기능]

        saveReview 함수: 카드를 클릭하면 실행됩니다.

        prompt 창: 브라우저 기본 팝업을 띄워서 "감상평"과 "별점"을 물어봅니다. (복잡한 입력창 대신 간단하게 구현했습니다!)

        POST 요청: 입력받은 내용을 백엔드 서버로 쏩니다.

    하지만 저장에 실패함. 이 방식은 DTO(Data Transfer Object) 패턴의 기초로, 백엔드 개발에서 아주 중요한 테크닉입니다. (필요한 것만 보여주기!)

        범인은 **BaseModel**입니다. 우리가 만든 Review 클래스는 BaseModel이라는 녀석을 상속받고 있습니다. (public class Review : BaseModel)

        Supabase: Review 객체 안에 DB 연결을 위한 **복잡한 장비(Primary Key 정보 등)**를 BaseModel을 통해 몰래 숨겨둡니다.

        ASP.NET: "저장 끝났으니 결과를 리액트한테 보내주자!" 하고 Review 객체를 포장(JSON 변환)하려고 뜯어보니, **JSON으로 변환할 수 없는 복잡한 장비(Attribute)**가 들어있어서 에러가 터진 겁니다.

        ✅ 해결 방법: "알맹이만 골라서 보내기"
        리액트한테는 복잡한 장비는 필요 없고, **데이터(제목, 내용 등)**만 필요하죠? 컨트롤러에서 **필요한 데이터만 쏙 뽑아서 새로운 상자(익명 객체)**에 담아 보내면 해결됩니다.

        ReviewController.cs 파일을 열고 CreateReview 함수를 아래처럼 바꿔주세요.

            // [기존 코드]
            // return Ok(newReview);  <-- 여기서 에러 발생! (BaseModel까지 다 보내려다 실패)

            // ▼▼▼ [이렇게 수정하세요] ▼▼▼
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

39. 내 서재 만들기 (조회)
    1단계: 백엔드에 "목록 조회" 기능 추가 (ReviewController.cs)
        창고지기(ReviewController)에게 "저장된 거 다 가져와(GET)" 라고 명령하면, 최신순으로 정렬해서 주는 기능을 만듭니다.

        백엔드 VS Code에서 **ReviewController.cs**를 엽니다.

        CreateReview 함수(POST) 밑에, 아래 **GetReviews 함수(GET)**를 추가하세요.

    2단계: 프론트엔드에 "내 서재" 탭 만들기 (App.jsx)
        이제 화면에 [검색] 탭과 [내 서재] 탭을 만들어서 왔다 갔다 할 수 있게 만듭니다. 코드가 좀 길어 보이지만, "탭 누르면 화면 바꾸기" 로직이 추가된 것뿐입니다.

        프론트엔드 VS Code의 App.jsx 전체를 아래 코드로 덮어씌워 주세요.

40. 감상문 삭제 기능
    1단계: 백엔드에 삭제 기능 만들기 (ReviewController.cs)
        창고지기(ReviewController)에게 **"삭제 명령(DELETE)"**을 가르칩니다.

        백엔드(CultureLog.API) 창에서 **ReviewController.cs**를 엽니다.

        아까 만든 GetReviews 함수 밑에, 아래 DeleteReview 함수를 추가하세요.

    2단계: 프론트엔드에 버튼 달기 (App.jsx)
        이제 내 서재에 빨간색 [삭제] 버튼을 달고, 버튼을 누르면 서버로 "지워줘!"라고 요청하게 만듭니다.

        **프론트엔드(CultureLog.Web)**의 App.jsx 전체를 아래 코드로 덮어씌워 주세요. (기존 코드에 handleDelete 함수와 삭제 버튼이 추가된 버전입니다.)

41. 배포

    1단계 git에 올리기
        .gitignore 만들기
        git init
        git add .
        git commit
        git branch -M main
        git remote add origin https://github.com/Seong-Park-Edu/CultureLog.git
        git push -u origin main

    2단계 백엔드 Render에 배포하기
        Name: culture-log-api (원하는 이름 아무거나)
        Region: Singapore (한국이랑 가깝고 빠릅니다)
        Branch: main (그대로 둠)
        Root Directory: (비워둠)
        Runtime: .NET (이걸 꼭 선택해야 합니다!) // 근데 이게 없음
        Build Command: (기존 내용을 지우고 아래 내용을 복사하세요)
        dotnet publish CultureLog.API -c Release -o out
        Start Command: (기존 내용을 지우고 아래 내용을 복사하세요)
        dotnet out/CultureLog.API.dll
        Instance Type: Free (무료)
        Environment Variables : 알잘딱깔센

    2단계 중 Runtime에 .net이 없어서 docker 생성함.
        **VS Code (백엔드)**에서 **가장 바깥쪽 폴더(CultureLog)**에 새 파일을 만듭니다.
        파일 이름: Dockerfile (확장자 없음! 그냥 Dockerfile입니다. 대소문자 중요!)

    2단계 다시 Runtime을 docker로 바꿈.
        Build Command와 Start Command 입력칸이 사라지거나 비활성화될 겁니다. (Dockerfile이 알아서 하니까요!)
        맨 아래 [Create Web Service] 클릭!
    
    배포 실패 : .net 10을 했는데 8로 내려야함.
        CultureLog.API 폴더 안에 있는 CultureLog.API.csproj 파일을 엽니다.

        내용이 아래와 똑같은지 확인하고, 다르면 덮어씌우세요.

        특히 <TargetFramework>net8.0</TargetFramework> 부분이 핵심입니다!

        패키지 버전들도 8.x.x나 호환되는 버전이어야 합니다.

    배포는 되었지만 swagger가 보이지 않음 (개발할 때난 개발모드일 때만 보이게 해놔서)
        Program.cs를 열고 딱 2가지만 수정
            var app = builder.Build();

            // [수정 1] Swagger를 개발환경(if문) 밖으로 꺼냅니다.
            // (원래는 if (app.Environment.IsDevelopment()) 안에 있었죠?)
            app.UseSwagger();
            app.UseSwaggerUI();

            // [수정 2] HTTPS 재전송 기능을 주석 처리합니다.
            // (Render 내부에서는 HTTP 통신을 하므로 이게 켜져 있으면 에러가 납니다.)
            // app.UseHttpsRedirection();  <-- 앞에 슬래시 두 개(//)를 넣어서 꺼주세요!

            app.UseAuthorization();
            app.MapControllers();

            app.Run();
    하고 다시 push

    3단계 리액트 vercel에 배포
    내 컴퓨터가 꺼져도 작동하려면, 리액트가 Render 주소를 바라봐야 합니다.

    App.jsx 파일을 엽니다.
    파일 안에서 http://localhost:5194 라고 적힌 부분을 찾습니다. (총 4군데 정도 있을 겁니다: 검색, 저장, 목록조회, 삭제)

    이걸 전부 방금 복사한 Render 주소로 바꿔주세요.
        // [변경 전]
        fetch(`http://localhost:5194/api/Search/${query}`)

        // [변경 후]
        fetch(`https://culture-log-api-xxxx.onrender.com/api/Search/${query}`)

    GitHub에 올리기

    Vercel.com 접속 -> 회원가입/로그인 (Continue with GitHub 추천).

        대시보드 오른쪽 [Add New...] -> [Project] 클릭.

        왼쪽 목록에 culture-log 레포지토리가 보일 겁니다. 옆에 있는 [Import] 버튼 클릭.

        설정 확인 (중요!):

        Framework Preset: Vite (자동으로 잡힐 겁니다.)

        Root Directory: 여기가 중요합니다! [Edit] 버튼을 누르고 CultureLog.Web 폴더를 선택하세요. (프론트엔드 파일은 저 안에 있으니까요.)

        [Deploy] 클릭!

42. CORS 설정
    🕵️‍♂️ 범인은 "CORS(보안 문지기)"
        아까 백엔드(Program.cs) 코드에 이런 내용을 넣었던 것 기억나시나요? policy.WithOrigins("http://localhost:5173")

        이건 "내 컴퓨터(Localhost)에서 오는 요청만 받아줘!" 라는 뜻입니다. 그래서 Vercel(https://culture-log...)에서 요청을 보내니 "너 누구야? 등록 안 된 주소인데?" 하고 문전박대(차단)를 당한 겁니다.

    Program.cs 파일을 엽니다.
    AddCors 부분과 UseCors 부분을 찾아서 아래처럼 바꿔주세요. (기존 코드를 지우고 이걸로 덮어쓰면 됩니다.)

        // [1] CORS 서비스 등록 (기존 코드 교체)
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.AllowAnyOrigin()  // "누구든지 환영해!" (Vercel 포함)
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        // ... (중간 생략) ...

        var app = builder.Build();

        // ... (중간 생략) ...

        // [2] CORS 정책 적용 (이름을 "AllowAll"로 맞춰주세요!)
        app.UseCors("AllowAll"); 

        app.UseHttpsRedirection(); // (참고: 아까 껐으면 주석 처리된 상태 유지)
        app.UseAuthorization();

43. 개발할 땐 local, 운영은 vercel에
    매번 코드를 고칠 때마다 localhost로 바꿨다가, 배포할 때는 다시 render.com 주소로 바꾸는 건 너무 귀찮고 실수하기 딱 좋죠.
    그래서 개발자들은 **"환경 변수(Environment Variable)"**라는 마법의 스위치를 사용합니다. 이걸 세팅하면, 컴퓨터가 알아서 "어? 여긴 내 컴퓨터네? 로컬 주소 써야지", "어? 여긴 Vercel이네? 배포 주소 써야지" 하고 주소를 싹 바꿔줍니다.
    
    1단계: 내 컴퓨터용 주소표 만들기 (.env)
        프론트엔드 폴더에 "내 컴퓨터에서는 이 주소를 써!"라는 비밀 쪽지를 만듭니다.
        **VS Code(프론트엔드)**에서 CultureLog.Web 폴더 바로 안에 새 파일을 만듭니다.
        파일 이름: .env (앞에 점 필수!)
        아래 내용을 복사해 넣습니다.
        VITE_API_URL=http://localhost:5194
        (설명: 내 컴퓨터(Local)에서 실행할 때는 백엔드 주소를 localhost:5194로 쓴다는 뜻입니다.)

    2단계: 코드 수정하기 (App.jsx)
        이제 App.jsx에서 주소를 직접 적는 대신, "쪽지에 적힌 주소를 가져와!" 라고 코드를 바꿉니다.
        App.jsx 파일을 엽니다.
        fetch 하는 부분(4군데)을 찾아서, 주소 앞부분을 **import.meta.env.VITE_API_URL**로 교체합니다.       

        // [이전 코드]
        // fetch(`https://culture-log-api.onrender.com/api/Search/${query}`)

        // [▼ 이렇게 바꾸세요!] (백틱 `` 사용 주의!)
        fetch(`${import.meta.env.VITE_API_URL}/api/Search/${query}`)

    👉 테스트: 이제 프론트엔드 터미널에서 npm run dev를 하고, 백엔드도 dotnet run으로 켜세요. 브라우저(localhost:5173)에서 잘 동작하나요? (이제 로컬끼리 통신합니다.)

    3단계: Vercel에 배포용 주소 알려주기
        내 컴퓨터 설정은 끝났습니다. 이제 Vercel에게 "네가 배포할 때는 Render 주소를 써야 해!" 라고 알려줘야 합니다.

        **Vercel 대시보드**로 가서 culture-log 프로젝트를 클릭합니다.

        상단 메뉴 중 [Settings] -> 왼쪽 메뉴 [Environment Variables] 클릭.

        아래 내용을 입력하고 [Save] 버튼 클릭.

        Key: VITE_API_URL

        Value: https://culture-log-api-xxxx.onrender.com (본인의 Render 백엔드 주소, 뒤에 / 빼고!)

        [Redeploy] 필요:

        환경 변수를 바꿨으니 다시 배포해야 적용됩니다.

        상단 [Deployments] 탭 -> 가장 최근 배포의 점 3개(...) 클릭 -> Redeploy 클릭.

    🔄 완벽해진 개발 사이클
        이제 여러분은 프로 개발자처럼 일할 수 있습니다.

        1. 기능 수정 및 테스트 (Local)

        내 컴퓨터에서 백엔드(dotnet run)와 프론트엔드(npm run dev)를 켭니다.

        코드를 수정하고 저장하면 브라우저에서 바로 확인됩니다.

        이때는 자동으로 Localhost DB와 통신하므로, 데이터를 막 지우고 테스트해도 실제 배포된 사이트에는 영향이 없습니다. (안전!)

        2. 배포 (Deploy)

        테스트가 끝났으면 터미널에서 3단 콤보를 날립니다.

        Bash

        git add .
        git commit -m "새로운 기능 추가!"
        git push
        끝입니다. GitHub에 올라가는 순간 Vercel과 Render가 알아서 새 코드를 가져가서 배포합니다.

        Vercel은 자동으로 https://render... 주소를 사용하도록 전환됩니다.

    🚀 요약
        내 컴퓨터: .env 파일 덕분에 localhost끼리 통신.

        Vercel: 설정 메뉴의 변수 덕분에 Render와 통신.

        코드: import.meta.env.VITE_API_URL 하나로 통일!

    1. 로컬 개발 (Local Development) 🏠

        어디서: 내 노트북 (localhost)

        무엇을: 코드를 마음껏 수정하고, 기능을 추가하고, 때로는 망가뜨려 봅니다.

        특징: 여기서 에러가 나도 전 세계 사람들은 모릅니다. 나만의 안전한 실험실입니다.

        백엔드 켜기: dotnet run

        프론트 켜기: npm run dev

    2. 검증 (Verify) ✅

        브라우저(localhost:5173)에서 버튼도 눌러보고, 콘솔창(F12)에 빨간 에러가 없는지 확인합니다.

        "오, 잘 된다! 이 정도면 친구들이 써도 되겠다!" 판단이 서면 다음 단계로 갑니다.

    3. 배포 (Deploy / Push) 🚀

        명령어: 3단 콤보 발사!

        git add .
        git commit -m "무슨무슨 기능 추가함"
        git push

    ⚠️ 딱 하나 조심할 점! (데이터베이스)
        지금 우리는 **"Supabase(데이터베이스)"**를 하나만 만들어서 쓰고 있습니다. 즉, **내 컴퓨터(Local)**도 저 Supabase를 보고 있고, **배포된 사이트(Vercel)**도 저 Supabase를 보고 있습니다.

        상황: 내 컴퓨터(localhost)에서 테스트한다고 "아이언맨" 리뷰를 삭제했습니다.

        결과: 배포된 사이트(vercel.app)에서도 "아이언맨"이 사라집니다.

44. 감상평을 쓰는 창을 모달로 띄워서 위즈위그 방식으로 변경하기.
    React Modal: 팝업창을 쉽게 띄워주는 도구
    React Quill: 글쓰기 에디터 (워드 프로세서처럼 보이는 도구)

    1단계: 도구 설치하기 (터미널)
        (CultureLog.Web)을 열고 아래 명령어를 입력
        npm install react-modal react-quill (옛날)
        npm install react-quill-new --legacy-peer-deps (이걸로 해)
        
    2단계: App.jsx 전체 수정
        코드가 꽤 많이 바뀝니다. prompt를 띄우던 로직을 없애고, **"모달을 여는 기능"**과 **"모달 화면"**을 추가해야 하거든요.

