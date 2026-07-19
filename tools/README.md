# tools — 피어라 페이지 생성기

`products/peera.html`은 **손으로 고치지 않는다.** 이 폴더의 스크립트가 만들어 낸다.

## 왜 생성기인가

피어라 페이지의 라이티 통화 데모는 랜딩페이지
([retyper/peera-landing](https://github.com/retyper/peera-landing))의 히어로 데모와 같은 것이다.
처음에는 CSS·JS를 손으로 옮겼는데, 그러다 **19개 셀렉터가 원본과 어긋났고** 아래 연출이
조용히 죽었다.

- `.phone { overflow: hidden }` 누락 → 일기 카드의 숨김 상태가 폰 밖으로 삐져나옴
- `.call-top { opacity: 0 }` 누락 → 통화 연결 뒤에만 보여야 할 상태바가 늘 보임
- 아이 말풍선이 보라(`--purple`)가 아니라 주황으로
- 공책 줄무늬 배경·도장 위치·마이크 배지·화면 비율 등 디테일 소실

눈으로 잡기 어려운 종류라, 옮기는 일을 사람이 하지 않게 했다.

## 쓰는 법

```bash
cd tools
node port-laity-demo.js
```

기본적으로 `../../peera-landing/index.html`을 읽는다. 다른 위치면:

```bash
PEERA_LANDING=/path/to/peera-landing/index.html node port-laity-demo.js
```

결과는 `../products/peera.html`에 덮어쓴다.

## 파일

| 파일 | 역할 |
|------|------|
| `port-laity-demo.js` | 랜딩 CSS를 읽어 변환하고 페이지를 조립한다 |
| `peera-shell.html` | 페이지 껍데기 — 마크업·다국어 사전. **소개 문구는 여기서 고친다** |
| `demo-core.js` | 데모 JS. 랜딩 원본을 그대로 두고 대본만 ko/en으로 분기 |

## 변환 내용

랜딩 CSS의 `.demo-col` ~ 공통 섹션 직전 구간을 잘라서:

1. 모든 셀렉터에 `.laity-demo` 스코프를 씌운다 (사이트 다크 테마와 충돌 방지)
2. 키프레임에 `ld-` 접두사 — Tailwind의 `animate-pulse`와 이름이 겹친다
3. 자산 경로를 `/assets/peera/`로 바꾼다

**주의**: `@keyframes`·`@media`는 스코프 대상이 아니다. 예전에 정규식 역추적 때문에
`.laity-demo @keyframes ld-pulse`가 생성돼 애니메이션이 전부 죽은 적이 있다.
지금은 그런 결과가 나오면 빌드가 실패한다.

## 데모를 고치고 싶다면

**랜딩 쪽(`peera-landing/index.html`)을 고치고 이 스크립트를 다시 돌린다.**
이 레포에서 데모 CSS를 직접 고치면 다음 실행 때 덮어써진다.

## 자산

`assets/peera/`의 파일들은 랜딩에서 복사한 것이다. 본품(dearmydiary)의 에셋이
갱신되면 랜딩 → 여기 순서로 옮긴다.

| 파일 | 용도 |
|------|------|
| `writy.riv` · `rive.js` · `rive.wasm` | 라이티 Rive 런타임·아트보드 (라이브 구동) |
| `writy-still.png` | Rive 로드 전·실패 시 포스터 |
| `laity-avatar.png` | 알림 배너·발신 화면의 원형 사진 |
| `stamp-good.png` | 일기의 "참 잘했어요" 도장 |
