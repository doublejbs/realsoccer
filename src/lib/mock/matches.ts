import type { MatchDTO } from "@/types";
import { MOCK_TEAMS } from "./teams";

function atHoursFromNow(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() + h, 0, 0, 0);
  return d.toISOString();
}

export const MOCK_MATCHES: MatchDTO[] = [
  {
    id: "m1",
    externalMatchId: "ext-m1",
    leagueCode: "PL",
    kickoffAt: atHoursFromNow(3),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    homeTeam: MOCK_TEAMS.liv,
    awayTeam: MOCK_TEAMS.manc,
    importance: 95, // 빅매치
  },
  {
    id: "m2",
    externalMatchId: "ext-m2",
    leagueCode: "PD",
    kickoffAt: atHoursFromNow(5),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    homeTeam: MOCK_TEAMS.rm,
    awayTeam: MOCK_TEAMS.atm,
    importance: 88, // 마드리드 더비
  },
  {
    id: "m3",
    externalMatchId: "ext-m3",
    leagueCode: "PL",
    kickoffAt: atHoursFromNow(6),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    homeTeam: MOCK_TEAMS.ars,
    awayTeam: MOCK_TEAMS.che,
    importance: 72,
  },
  {
    id: "m4",
    externalMatchId: "ext-m4",
    leagueCode: "BL1",
    kickoffAt: atHoursFromNow(4),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    homeTeam: MOCK_TEAMS.bvb,
    awayTeam: MOCK_TEAMS.bay,
    importance: 80, // 클래시커
  },
  {
    id: "m5",
    externalMatchId: "ext-m5",
    leagueCode: "PD",
    kickoffAt: atHoursFromNow(8),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    homeTeam: MOCK_TEAMS.fcb,
    awayTeam: MOCK_TEAMS.atm,
    importance: 70,
  },
];

// 과거 완료 경기 (요약 mock 용)
export const MOCK_FINISHED: MatchDTO = {
  id: "f1",
  externalMatchId: "ext-f1",
  leagueCode: "PL",
  kickoffAt: new Date(Date.now() - 86400000).toISOString(),
  status: "FINISHED",
  homeScore: 3,
  awayScore: 2,
  homeTeam: MOCK_TEAMS.liv,
  awayTeam: MOCK_TEAMS.ars,
  importance: 85,
};
