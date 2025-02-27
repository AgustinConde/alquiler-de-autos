class RentalError extends Error {};
class RentalNotFoundError extends Error {};
class RentalNotDefinedError extends Error {};
class RentalIdNotDefinedError extends Error {};

module.exports = {
    RentalError,
    RentalNotFoundError,
    RentalNotDefinedError,
    RentalIdNotDefinedError
}
