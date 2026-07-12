const ROLES = {
    STUDENT: "student",
    ADMIN: "admin",
}
const RELATION = {
    FATHER: "father",
    MOTHER: "mother",
    GUARDIAN: "guardian",
    BROTHER: "brother",
    SISTER: "sister",
    UNCLE: "uncle",          
    MATERNAL_UNCLE: "maternal_uncle",
}

const PAYMENT_STATUS = {
    UNPAID: "UNPAID",
    PAID: "PAID",
}

const ADMIN_STATUS = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
}

const PAYMENT_METHOD = {
    FAWRY_PAY_AT_STORE: "FAWRY_PAY_AT_STORE",
    CARD: "CARD",
}

const TRANSACTION_STATUS = {
    PENDING: "PENDING",
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
    EXPIRED: "EXPIRED",
}

export {
    ROLES,
    RELATION,
    PAYMENT_STATUS,
    ADMIN_STATUS,
    PAYMENT_METHOD,
    TRANSACTION_STATUS,
}