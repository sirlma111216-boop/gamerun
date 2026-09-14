/**
 * 강의 앱 연동 계약 (수업·활동·사용자 한정 증명).
 *
 * 강의 앱 서버가 로그인 세션을 검증한 뒤 짧은 유효기간의 티켓을 발급하고,
 * 게임 서버는 서명·발급자·대상·만료·활동·역할을 확인한 뒤에야 방을 만들거나 참가시킨다.
 * ID 와 닉네임은 티켓에서 가져오고 브라우저가 보낸 값은 믿지 않는다.
 *
 * 형식: base64url(JSON payload) + '.' + base64url(HMAC-SHA256(secret, base64url(payload)))
 */
export const LESSON_TICKET_ISSUER = 'scienced';
export const LESSON_TICKET_AUDIENCE = 'lumi-run';
export type LessonRole = 'teacher' | 'student';
export type LessonTicket = {
 iss: string;
 aud: string;
 /** 수업(클래스) id */
 cid: string;
 /** 차시 id */
 lid: string;
 /** 활동 실행 id — 방의 activityId 와 같아야 한다 */
 act: string;
 /** 사용자 id (안정적인 학생 ID) */
 sub: string;
 /** 표시 이름 (닉네임, 18자 이내로 잘라 쓴다) */
 name: string;
 role: LessonRole;
 iat: number;
 exp: number;
};
/** 강의 앱이 연동 방에 적용하는 시작 정책 — 이 앱의 발표자 뽑기는 강사가 실행한다 */
export const LESSON_START_POLICY = 'teacher' as const;
/** 연동 결과 전달(webhook) 본문 */
export type LessonResultEnvelope = {
 type: 'lumi.result';
 sentAt: string;
 room: {code: string; activityId: string; cid: string; lid: string};
 result: import('./types.js').GameResult;
};
export const NAME_MAX = 18;
