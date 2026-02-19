# 주역 GUI 사용법

## 실행
- `gui/index.html`을 브라우저에서 열면 바로 사용 가능합니다.
- VS Code에서는 `index.html` 우클릭 → Open with Live Server(설치 시)로 실행하면 편합니다.

## 기능
0. 언어 선택(중국어 제외 18개 언어: ko/en/ar/de/el/es/fr/hi/it/ja/nl/pl/pt/sv/th/tr/vi/ru)
1. 질문 입력
2. 동전 자동 던지기(1효씩 6회) 또는 수동 6/7/8/9 입력
3. 본괘/지괘 시각 표시
4. King Wen 번호 자동 매핑(본괘/지괘)
5. 변효 위치 및 읽기 가이드 표시
6. 1~64 괘 번호 조회 시 한줄 해설 표시
7. 변효 개수(0~6)별 효사 우선 읽기 규칙 버튼 제공
8. 규칙별 즉시 행동 체크 3문항(예/아니오) 제공
9. localStorage 자동 저장/복원(질문, 효 입력 상태, 규칙 체크, 조회 번호)
10. 오늘 기록 내보내기(JSON/TXT 다운로드)
11. 내보낸 JSON 기록 불러오기(import)
12. 최근 기록 5개 빠른 저장/복원(파일 선택 없이 클릭 복원)
13. 질문 태그(일반/직장/사업/인간관계) 저장
14. 최근 기록 태그 필터(전체/직장/사업/인간관계)
15. 앱 데이터 전체 초기화(현재 상태+최근 기록 일괄 삭제)
16. 태그별 질문 템플릿 선택/적용
17. 계사전 핵심 원칙 카드(64괘별 정밀 매핑 + 본괘→지괘 전환 반영)
18. 태그+변효 흐름 결합 실행 권고 문구 자동 생성(변효 0~6 가중 반영)
19. 02+04번 문서 기반 괘별 4태그(일반/직장/사업/인간관계) 권고 문구 자동 매핑(`gui/hex_practice_data.js`)
20. 변효 가중 단계 배지 표시(본괘 우선/병행/지괘 중심)
21. 가중 단계 배지 클릭 시 단계별 해설 문구 토글 표시
22. 배지 해설 확장: 태그별 오늘 할 일/주의/보류 3줄 가이드 표시
23. JSON/TXT 내보내기에 가중 단계/해설/3줄 가이드 포함
24. 최근기록 카드에 3줄 가이드 첫 줄 미리보기 표시
25. 최근기록 카드에 가중 단계 배지 미리보기 표시
26. 최근기록 카드에서 TXT 바로 내보내기 지원
27. 최근기록 카드에서 JSON 바로 내보내기 지원
28. 최근기록 액션 버튼 한 줄 정렬(복원/TXT/JSON)
29. 최근기록 액션 버튼 라벨 축약(모바일 가독성)
30. 최근기록 액션 버튼 모노톤 심볼+텍스트 라벨 적용
31. 상단 액션 버튼 문체/라벨 톤 통일(심볼+짧은 텍스트)

## 해석 순서 권장
- 본괘 흐름 확인
- 변효 위치 확인
- 지괘(변화 후) 확인
- 기존 문서(01~07)에서 세부 해설 교차확인

## 메모
- 자동 매핑은 `Hexagram (I Ching)`의 lookup table(상괘/하괘) 기준으로 구현했습니다.
- 추가로 효사·괘사 원문까지 붙이면 더 정밀한 리딩 도구로 확장 가능합니다.
- 초기화가 필요하면 앱에서 `초기화` 버튼을 눌러 현재 입력 상태를 비우세요.

## 모바일 앱 배포(Android/iOS)

### 1) 초기 설치
- `gui` 폴더에서 실행:
	- `npm install`

### 2) 웹 리소스 빌드 + 네이티브 동기화
- Android만 동기화: `npm run cap:sync:android`
- iOS만 동기화: `npm run cap:sync:ios`
- 전체 동기화: `npm run cap:sync`

### 2-1) 앱 아이콘/스플래시 생성
- 소스 파일: `gui/resources/icon.svg`, `gui/resources/splash.svg`
- 생성 명령: `npm run assets:generate`
- 생성 후 반드시 동기화: `npm run cap:sync:android` 또는 `npm run cap:sync:ios`

### 3) 안드로이드
- 플랫폼 추가(최초 1회): `npx cap add android`
- Android Studio 열기: `npm run cap:open:android`
- Android Studio에서 `Build > Generate Signed Bundle / APK`로 AAB/APK 생성
- CLI로 릴리즈 키 생성: `npm run android:keystore:create`
- CLI로 릴리즈 AAB 생성: `npm run android:release:aab`
- CLI로 릴리즈 APK 생성: `npm run android:release:apk`

### 4) iOS
- 플랫폼 추가(최초 1회): `npx cap add ios`
- Xcode 열기: `npm run cap:open:ios`
- Xcode에서 Signing 설정 후 Archive → App Store Connect 업로드

### 5) 반복 배포 시
- 앱 코드 수정 후 매번 `npm run cap:sync` 실행
- 이후 Android Studio/Xcode에서 재빌드

### 참고
- iOS 최종 빌드/서명은 macOS + Xcode 환경이 필요합니다.
- iOS에서 `pod install` 오류가 나면 macOS에서 CocoaPods 설치 후 `npx cap sync ios`를 다시 실행하세요.
- Windows에서 `npm` 인식이 안 되면 PowerShell을 재시작하거나 Node 설치 경로(`C:\Program Files\nodejs`)를 PATH에 추가하세요.

## 다국어 QA
- 번역 키 커버리지 점검: `npm run i18n:check`
- 기준은 `en` 키셋이며, 누락 키는 영어로 자동 fallback 됩니다.

## 라이선스 컴플라이언스
- 정책 파일: `gui/license-policy.json`
	- `forbiddenLicensePatterns`: 빌드/배포 차단 대상
	- `reviewRequiredLicensePatterns`: 법무/정책 검토 대상
- 승인 파일: `gui/license-review-approvals.json`
	- `package`: `name@version` 형식
	- `resolvedLicense`: 검토 후 채택한 라이선스 근거
	- `note`: 승인 근거(라이선스 파일 확인, 사용 범위 등)
- 자동 감사 + 고지문 생성: `npm run license:audit`
	- 출력 파일: `gui/THIRD_PARTY_NOTICES.md`
	- 금지 패턴 매칭이 1건 이상이면 명령이 실패(종료코드 1)합니다.
	- 승인되지 않은 review 항목이 1건 이상이어도 명령이 실패(종료코드 1)합니다.
- CI 게이트: `.github/workflows/quality-gate.yml`
	- `gui/**` 변경 시 `npm ci` + `npm run verify:release`를 자동 실행합니다.
	- 결과 `THIRD_PARTY_NOTICES.md`/`www`를 아티팩트로 업로드합니다.
- 통합 검증 명령: `npm run verify:release`
	- `i18n:check` → `license:audit` → `build:web` 순서로 실행합니다.
- GitHub 브랜치 보호(권장)
	1) GitHub 저장소 → `Settings` → `Branches` → `Add branch protection rule`
	2) 대상 브랜치 패턴(예: `main`) 지정
	3) `Require a pull request before merging` 활성화
	4) `Require status checks to pass before merging` 활성화
	5) Required checks에 `Quality Gate / verify` 선택
	6) 저장 후 PR에서 `Quality Gate` 실패 시 머지 차단 확인
- PR 템플릿: `.github/pull_request_template.md`
	- 리뷰어/작성자가 `Quality Gate`, 라이선스 감사, i18n 점검 결과를 체크리스트로 확인합니다.
- CODEOWNERS: `.github/CODEOWNERS`
	- `@YOUR_GITHUB_ID` 플레이스홀더를 실제 GitHub 사용자/팀으로 교체하면 PR 리뷰어 자동 지정에 사용할 수 있습니다.
- 배포 전 권장 순서
	1) `npm run verify:release`
	2) 실패 시 로그와 `THIRD_PARTY_NOTICES.md`의 `Review Unresolved` 확인
	3) 필요 시 `license-review-approvals.json` 승인 근거 보완 후 재실행
	4) 통과 시에만 Android/iOS 릴리즈 진행

## Play Console 업로드 체크리스트

1. 앱 버전 확인
	- `android/app/build.gradle`의 `versionCode` 증가 확인
	- `versionName`이 배포 버전과 일치하는지 확인
2. 서명키 준비
	- `android/keystore.properties` 존재 확인
	- `android/release-keystore/juyeok-release.jks` 백업(오프라인 1부 + 클라우드 1부)
3. 릴리즈 빌드
	- `npm run assets:generate`
	- `npm run android:release:aab`
	- 산출물: `android/app/build/outputs/bundle/release/app-release.aab`
4. 설치 검증
	- 내부 테스트 트랙 업로드 전 실기기 설치 확인
	- 시작/종료, 질문 입력, 자동/수동 6효, 저장/복원, 내보내기 동작 점검
5. 스토어 등록
	- 앱 이름/설명/카테고리/연락처 입력
	- 스크린샷(휴대폰 필수), 개인정보처리방침 URL 등록
	- 앱 콘텐츠(광고/아동/데이터안전) 설문 완료
6. 배포 전 최종
	- PR 머지 전 `Quality Gate / verify` 체크 통과 확인
	- 내부 테스트 트랙 승인 확인
	- 문제 없으면 프로덕션 릴리즈 승격
