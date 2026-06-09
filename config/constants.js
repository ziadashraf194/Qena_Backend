const ROLES = {
    USER: "user",
    ADMIN: "admin",
}
const PAYMENT_METHODS = {
    CARD: "card",
    CASH: "cash",
    FAWRY: "fawry",
    E_WALLET: "ewallet",
}
const PAYMENT_STATUS = {
    PAID: "paid",
    UNPAID: "unpaid",
}
const ORDER_STATUS = {
    PENDING: "pending",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
}

const USER_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
}

export {
    ROLES,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    ORDER_STATUS,
    USER_STATUS,
}