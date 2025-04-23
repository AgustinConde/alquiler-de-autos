// Script intended to be used in https://structurizr.com/dsl for replicating the C4 Diagrams in the 'docs/en' folder

workspace "Rent-a-Car" "Car rental system project"{

!identifiers hierarchical
    
    model {
        admin = person "Administrator" "Person who manages the car rental system"
        client = person "Client" "Person who rents cars from the web"

        system = softwareSystem "Car Rental System" "Web application to manage car rentals" {
            database = container "Database (SQLite)" "Stores and manages information about cars, clients, rentals, payments, and audit logs" "SQLite" {
                tags "Database"
            }
            app = container "Car Rental Web Application" "Node.js/Express backend that exposes the API and renders views" "Node.js/Express" {
                // Auth
                auth_controller = component "AuthController" "Handles authentication and user registration" "Express"
                auth_service = component "AuthService" "Authentication logic" "Node.js"
                auth_repository = component "AuthRepository" "Authentication data access" "Node.js"
                // Client
                client_controller = component "ClientController" "Manages clients" "Express"
                client_service = component "ClientService" "Client logic" "Node.js"
                client_repository = component "ClientRepository" "Client data access" "Node.js"
                // Car
                car_controller = component "CarController" "Manages cars" "Express"
                car_service = component "CarService" "Car logic" "Node.js"
                car_repository = component "CarRepository" "Car data access" "Node.js"
                // Rental
                rental_controller = component "RentalController" "Manages rentals" "Express"
                rental_service = component "RentalService" "Rental logic" "Node.js"
                rental_repository = component "RentalRepository" "Rental data access" "Node.js"
                // Payment
                payment_controller = component "PaymentController" "Manages payments" "Express"
                payment_service = component "PaymentService" "Payment logic" "Node.js"
                payment_repository = component "PaymentRepository" "Payment data access" "Node.js"
                // Audit
                audit_service = component "AuditService" "Action auditing" "Node.js"
                audit_repository = component "AuditRepository" "Audit data access" "Node.js"
                // Default
                default_controller = component "DefaultController" "Default and error pages" "Express"

                // Internal relationships
                auth_controller -> auth_service
                auth_service -> auth_repository
                auth_repository -> database

                client_controller -> client_service
                client_service -> client_repository
                client_repository -> database

                car_controller -> car_service
                car_service -> car_repository
                car_repository -> database

                rental_controller -> rental_service
                rental_service -> rental_repository
                rental_repository -> database

                payment_controller -> payment_service
                payment_service -> payment_repository
                payment_repository -> database

                audit_service -> audit_repository
                audit_repository -> database

                // AuditService is called by other services
                client_service -> audit_service
                car_service -> audit_service
                rental_service -> audit_service
                payment_service -> audit_service

                // DefaultController can access general services
                default_controller -> client_service
                default_controller -> car_service
            }
            admin -> system.app "Manages the system"
            client -> system.app "Uses the system to rent cars"
            app -> database "Reads and writes data"
        }
    }

    views {
        systemContext system "C4-Level-1" {
            include *
            autolayout lr
        }
        
        container system "C4-Level-2" {
            include *
            autolayout lr
        }
        
        component system.app "C4-Level-3" {
            include *
            autolayout tb
        }
        
        styles {
            element "Element" {
                color white
            }
            element "Person" {
                background #351c75
                shape person
            }
            element "Software System" {
                background #674ea7
            }
            element "Container" {
                background #8e7cc3
            }
            element "Component" {
                background #b4a7d6
            }
            element "Database" {
                shape cylinder
            }
        }
    }
}
