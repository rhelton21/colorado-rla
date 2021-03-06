import * as _ from 'lodash';

function parseBoardMember(e: JSON.AuditBoardMember): AuditBoardMember {
    return {
        firstName: e.first_name,
        lastName: e.last_name,
        party: e.political_party,
    };
}

function parseAuditBoards(boards: JSON.AuditBoards): AuditBoards {
    const ret: AuditBoards = {};

    _.forEach(boards, (status, k) => {
        const index = parseInt(k, 10);

        ret[index] = {
            members: _.map(status.members, parseBoardMember),
            signIn: status.sign_in_time,
        };
    });

    return ret;
}

function parseTimestamp(ts: string): Date {
    return new Date(ts);
}

function pivot(a: any): any {
    const o: any = {};

    a.forEach((v: any) => {
        o[v.id] = v;
    });

    return o;
}

export function parseContests(contestIds: number[], state: County.AppState): Contest[] {
    const { contestDefs } = state;

    if (!contestDefs) {
        return [];
    }

    if (_.isEmpty(contestDefs)) {
        return [];
    }

    return _.map(contestIds, id => contestDefs[id]);
}

function parseContestsUnderAudit(contestIds: number[], state: County.AppState): Contest[] {
    const { contestDefs } = state;

    if (!contestDefs) {
        return [];
    }

    if (_.isEmpty(contestDefs)) {
        return [];
    }

    return _.map(contestIds, (reason, id) => {
        const def = contestDefs![id];
        return { ...def };
    });
}

function parseSignatories(s?: JSON.Signatories): Signatories {
    if (!s) {
        return {};
    }

    const ret: Signatories = {};

    _.forEach(s, (electors, idx: any) => {
        ret[idx] = _.map(electors, (e: JSON.Elector): Elector => {
            return {
                firstName: e.first_name,
                lastName: e.last_name,
            };
        });
    });

    return ret;
}

function parseRound(data: JSON.Round): Round {
    return {
        actualCount: data.actual_count,
        disagreements: data.disagreements,
        discrepancies: data.discrepancies,
        expectedCount: data.expected_count,
        number: data.number,
        signatories: parseSignatories(data.signatories),
        startAuditPrefixLength: data.start_audit_prefix_length,
        startIndex: data.start_index,
        startTime: data.start_time,
    };
}

function parseRounds(rounds?: JSON.Round[]): Round[] {
    if (!rounds) {
        return [];
    }

    return rounds.map(parseRound);
}

function parseElection(data: JSON.CountyDashboard): Election {
    return {
        date: new Date(data.audit_info.election_date),
        type: data.audit_info.election_type,
    };
}

function parseRiskLimit(data: JSON.CountyDashboard): number {
    return _.get(data, 'audit_info.risk_limit');
}

function parseDisCount(data: any): number {
    return _.sum(_.values(data));
}

function parseFile(file: JSON.UploadedFile): Option<UploadedFile> {
    if (!file) { return null; }

    return {
        approximateRecordCount: file.approximateRecordCount,
        countyId: file.countyId,
        fileName: file.fileName,
        hash: file.hash,
        id: file.id,
        result: file.result,
        size: file.size,
        status: file.status,
        timestamp: new Date(file.timestamp),
    };
}

function parseCVRImportStatus(data: JSON.CVRImportStatus): County.CVRImportStatus {
    return {
        error: data.error_message,
        state: data.import_state,
        timestamp: new Date(data.timestamp),
    };
}

export function parse(data: JSON.CountyDashboard, state: County.AppState) {
    const findContest = (id: number) => state.contestDefs![id];

    return {
        asm_state: data.asm_state,
        auditBoardCount: data.audit_board_count,
        auditBoards: parseAuditBoards(data.audit_boards),
        auditTime: data.audit_time ? parseTimestamp(data.audit_time) : null,
        auditedBallotCount: data.audited_ballot_count,
        auditedPrefixLength: data.audited_prefix_length,
        ballotManifest: parseFile(data.ballot_manifest_file),
        ballotManifestCount: data.ballot_manifest_count,
        ballotSequenceAssignment: data.ballot_sequence_assignment,
        ballotUnderAuditIds: data.ballot_under_audit_ids,
        ballotsRemainingInRound: data.ballots_remaining_in_round,
        contests: parseContests(data.contests, state),
        contestsUnderAudit: parseContestsUnderAudit(data.contests_under_audit, state),
        currentRound: data.current_round ? parseRound(data.current_round) : null,
        cvrExport: parseFile(data.cvr_export_file),
        cvrExportCount: data.cvr_export_count,
        cvrImportStatus: parseCVRImportStatus(data.cvr_import_status),
        disagreementCount: parseDisCount(data.disagreement_count),
        discrepancyCount: parseDisCount(data.discrepancy_count),
        election: parseElection(data),
        estimatedBallotsToAudit: data.estimated_ballots_to_audit,
        generalInformation: data.general_information,
        id: data.id,
        riskLimit: parseRiskLimit(data),
        rounds: parseRounds(data.rounds),
        status: data.status,
    };
}
