# 모듈 연결 안내 · 2.0

## 설치와 기존 앱 닉네임

`npm ci` 후 `npm run build`를 실행합니다. `dist/module/lumi-run.js`는 그림·QR·스타일을 포함하는 ES 모듈입니다. 타입은 `dist/module/types/src/game/module.d.ts`와 이 파일이 참조하는 `types/shared`에 있습니다. 게임 서버는 프로젝트 루트에서 `npm start`로 실행합니다.

```js
import {mountLumiRun} from '/vendor/lumi-run.js';
const handled = new Set();
const game = mountLumiRun(document.querySelector('#activity'), {
  title: '우리 반의 모험',
  description: '다음 활동 주인공을 찾아요',
  participant: {id: currentStudent.id, name: currentStudent.nickname},
  activityId: 'science-week-03',
  storageKey: 'science-week-03-slot-1',
  map: 2,
  rules: {mode:'race', duration:60, lives:0, count:3},
  serverUrl: 'wss://your-game.example/ws',
  joinBaseUrl: 'https://your-lesson.example/activity',
  onReady: state => console.log('방 준비', state.code),
  onStart: state => console.log('출발', state.matchId),
  onEnd: result => console.log('종료', result.endReason),
  onResult: result => {
    if (handled.has(result.matchId)) return;
    handled.add(result.matchId);
    // 강의 앱에서 저장·점수·다음 화면을 결정합니다.
    console.log(result.selectedIds);
  }
});
```

`currentStudent`는 기존 앱이 가진 학생 정보입니다. `participant.name`을 전달하면 입력란은 그 닉네임으로 고정되고 입장 메시지·머리 위 이름표·결과에도 같은 이름을 사용합니다. 참가 ID는 표시 이름과 분리되어 있습니다. 닉네임은 18자 이내로 전달하세요. 이 설정은 계정 인증을 대신하지 않습니다.

교사 화면에는 `participant`를 생략해도 됩니다. 같은 페이지에 여러 게임을 넣을 때는 서로 다른 `storageKey`를 사용합니다. 개별 소켓·키보드·타이머·렌더링을 제거하는 `destroy()`가 제공되며 학생 화면 제거가 방 전체 종료를 뜻하지 않습니다. 스타일은 Shadow DOM으로 격리됩니다.

## 현재 설정

| 값 | 지원 범위 |
|---|---|
| map | 1 초원, 2 공중정원, 3 사막, 4 수정동굴, 5 별빛공장 |
| mode | race: 도착 보상, last: 꼴찌 선정 |
| duration | 30 / 45 / 60 / 90. **코스 길이**, 제한 시간이 아님 |
| lives | 0(무한), 1, 3, 5 |
| count | 선정 인원 1~30, 시작 시 연결 참가 인원 이하 |
| text | 외부 앱 결과 제목, 80자 이내. 게임의 세부 설정 화면에는 노출하지 않음 |

도착 보상은 상위 N명, 꼴찌는 N명 탈락 또는 첫 완주 발생 시점의 뒤쪽 순서, 동점은 공동 선정으로 고정합니다. 자세한 예외는 `RULES.md`에 있습니다. 임의 규칙 코드는 받지 않습니다.

`theme`(light/night), `accent`(#RRGGBB), `title`, `description`, `activityId`, `serverUrl`, `joinBaseUrl`도 지원합니다.

## 공개 메서드와 결과

- `practice()`: 무한 재도전 로컬 연습.
- `start()`: 교사 또는 참가자가 현재 방 전체 출발을 요청.
- `stop()`: 교사만 강제 종료.
- `restart()`: 교사만 결과 후 새 경기 ID로 같은 방 재경기.
- `destroy()`: 현재 화면과 연결 자원 정리.
- `getState()`: 최근 서버 상태. `version`, `capabilities`로 버전·지원 기능 확인.

결과 예시(형식 설명용):

```json
{
  "gameVersion":"2.0.0","moduleVersion":"2.0.0","resultVersion":"2.0",
  "matchId":"server-generated-uuid","activityId":"science-week-03","map":1,
  "rules":{"mode":"race","duration":60,"lives":0,"count":1,"text":"이번 모험의 선정자"},
  "players":[{"id":"student-1042","name":"하나","status":"finished","rank":1,"finishTime":47.1,"progress":12161,"connected":true,"bot":false}],
  "selectedIds":["student-1042"],"selectionReason":"완주 순서 상위 1명",
  "tieHandling":"경계의 같은 도착 틱·탈락 틱·현재 위치는 공동 선정",
  "endReason":"normal","endedAt":"2026-09-14T00:00:00.000Z"
}
```

저장에는 `matchId`를 중복 방지 키로 사용합니다. 표시 이름을 학생 식별 키로 쓰지 마세요. 결과 순위표는 정상 도착 순위를 표시하고 선정 ID를 별도로 전달하므로 꼴찌 모드에서 표의 1등과 선정자가 다를 수 있습니다.

## iframe 연결

```html
<iframe id="lumi" title="루미 런"
 src="https://your-game.example/embed.html?parentOrigin=https%3A%2F%2Fyour-lesson.example"
 allow="fullscreen" style="width:100%;height:900px;border:0"></iframe>
```

부모는 메시지의 `origin`과 `source`를 확인하고, `lumi:available` 수신 후 정확한 게임 출처를 대상으로 다음 메시지를 보냅니다.

```js
frame.contentWindow.postMessage({type:'lumi:mount',config:{
  participant:{id:currentStudent.id,name:currentStudent.nickname},
  activityId:'math-01',map:3,rules:{mode:'last',lives:3,count:2},
  serverUrl:'wss://your-game.example/ws'
}}, 'https://your-game.example');
```

수신 이벤트: `lumi:available`, `lumi:ready`, `lumi:start`, `lumi:end`, `lumi:result`.
송신 명령: `lumi:mount`, `lumi:start`, `lumi:stop`, `lumi:restart`, `lumi:destroy`.

## 1.x에서 2.0으로 변경

맵 ID는 1~5로 바뀌었습니다. `survival`, `rank`, `selection`, `ties`, `fallback`, `lastScope`, `early` 옵션은 제거했습니다. `duration`은 시간 종료를 만들지 않습니다. 서버·클라이언트·모듈을 같은 2.0 빌드로 함께 교체하고 이전 방은 새로 만드세요. 방 상태는 메모리이므로 서버 재시작으로 없어집니다.

샘플 강의 A는 도착 보상으로 다음 발표자를 표시합니다. B는 꼴찌 선정 결과에 선정 3점·참여 1점을 기록합니다. 게임 본체를 수정하지 않고 규칙·제목·결과 콜백만 다르게 전달합니다. 외부 배포 절차는 `DEPLOYMENT.md`를 참고하세요.
