// Script intended to be used in https://structurizr.com/dsl for replicating the C4 Diagrams in 'docs' folder

workspace "Rent-a-Car" "Proyecto de sistema de alquiler de autos"{

!identifiers hierarchical
    
    model {
        admin = person "Administrador" "Persona que administra el sistema para alquilar autos"
        client = person "Cliente" "Persona que alquila autos desde la web"

        system = softwareSystem "Sistema de Alquiler de Autos" "Aplicación web para gestionar alquileres de autos" {
            database = container "Base de Datos (SQLite)" "Almacena y gestiona la información de los autos, clientes, alquileres, pagos y auditoría" "SQLite" {
                tags "Database"
            }
            app = container "Aplicación web de Alquiler de Autos" "Backend Node.js/Express que expone la API y renderiza vistas" "Node.js/Express" {
                // Auth
                auth_controller = component "AuthController" "Gestiona autenticación y registro de usuarios" "Express"
                auth_service = component "AuthService" "Lógica de autenticación" "Node.js"
                auth_repository = component "AuthRepository" "Acceso a datos de autenticación" "Node.js"
                // Client
                client_controller = component "ClientController" "Gestiona clientes" "Express"
                client_service = component "ClientService" "Lógica de clientes" "Node.js"
                client_repository = component "ClientRepository" "Acceso a datos de clientes" "Node.js"
                // Car
                car_controller = component "CarController" "Gestiona autos" "Express"
                car_service = component "CarService" "Lógica de autos" "Node.js"
                car_repository = component "CarRepository" "Acceso a datos de autos" "Node.js"
                // Rental
                rental_controller = component "RentalController" "Gestiona alquileres" "Express"
                rental_service = component "RentalService" "Lógica de alquileres" "Node.js"
                rental_repository = component "RentalRepository" "Acceso a datos de alquileres" "Node.js"
                // Payment
                payment_controller = component "PaymentController" "Gestiona pagos" "Express"
                payment_service = component "PaymentService" "Lógica de pagos" "Node.js"
                payment_repository = component "PaymentRepository" "Acceso a datos de pagos" "Node.js"
                // Audit
                audit_service = component "AuditService" "Auditoría de acciones" "Node.js"
                audit_repository = component "AuditRepository" "Acceso a datos de auditoría" "Node.js"
                // Default
                default_controller = component "DefaultController" "Páginas por defecto y errores" "Express"

                // Relaciones internas
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

                // AuditService es llamado por otros services
                client_service -> audit_service
                car_service -> audit_service
                rental_service -> audit_service
                payment_service -> audit_service

                // DefaultController puede acceder a servicios generales
                default_controller -> client_service
                default_controller -> car_service
            }
            admin -> system.app "Administra el sistema"
            client -> system.app "Usa el sistema para alquilar autos"
            app -> database "Lee y escribe datos"
        }
    }

    views {
        systemContext system "C4-Nivel-1" {
            include *
            autolayout lr
        }
        
        container system "C4-Nivel-2" {
            include *
            autolayout lr
        }
        
        component system.app "C4-Nivel-3" {
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
