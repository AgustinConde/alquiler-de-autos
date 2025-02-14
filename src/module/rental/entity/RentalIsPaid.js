class RentalIsPaid {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}

module.exports.isPaid = {
    PENDING: new RentalIsPaid('Pending', 0),
    PAID: new RentalIsPaid('Paid', 1)
};
module.exports.RentalIsPaid = RentalIsPaid;
