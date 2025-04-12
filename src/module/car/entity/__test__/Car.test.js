const Car = require('../Car');

describe('Car Entity', () => {
  describe('fullName getter', () => {
    test('should return brand and model concatenated', () => {
      const car = new Car(
        1, 
        'Toyota', 
        'Corolla', 
        2020, 
        5000, 
        'Red', 
        true, 
        5, 
        'automatic', 
        50, 
        '/uploads/car.jpg',
        new Date(),
        new Date(),
        null,
        []
      );
      
      expect(car.fullName).toBe('Toyota Corolla');
    });
    
    test('should handle null or undefined brand/model', () => {
      const car1 = new Car(
        1, 
        null, 
        'Corolla', 
        2020, 
        5000, 
        'Red', 
        true, 
        5, 
        'automatic', 
        50, 
        '/uploads/car.jpg'
      );
      
      const car2 = new Car(
        2, 
        'Toyota', 
        undefined, 
        2020, 
        5000, 
        'Red', 
        true, 
        5, 
        'automatic', 
        50, 
        '/uploads/car.jpg'
      );
      
      expect(car1.fullName).toBe(' Corolla');
      expect(car2.fullName).toBe('Toyota ');
    });
  });
});
