// Script intended to be used in https://structurizr.com/dsl for replicating the C4 Diagrams in 'docs' folder

workspace "Rent-a-Car" "Proyecto de sistema de alquiler de autos"{

!identifiers hierarchical
    
    model {
        admin = person "Administrador" "Persona que administra el sistema para alquilar autos"

        system = softwareSystem "Sistema de Alquiler de Autos" "Aplicación web para gestionar alquileres de autos" {
            database = container "Base de Datos (SQLite)" "Almacena y gestiona la información de los autos y alquileres" "SQLite" {
                tags "Database"
            }
            app = container "Aplicación web de Alquiler de Autos" "Muestra la información de los autos y alquileres" "Node.js" {
                backend = component "Aplicación web de Alquiler de Autos" "Muestra la información de los autos y alquileres" "Node.js"
                
                user_controller = component "UserController" "Interfaz entre la entrada y la lógica de dominio" "Express"
                user_service = component "UserService" "Maneja la lógica de negocio de usuarios" "Node.js"
                user_repository = component "UserRepository" "Interfaz entre el módulo de usuarios y la base de datos" "Node.js"
    
                car_controller = component "CarController" "Interfaz entre la entrada y la lógica de dominio" "Express"
                car_service = component "CarService" "Maneja la lógica de negocio de autos" "Node.js"
                car_repository = component "CarRepository" "Interfaz entre el módulo de autos y la base de datos" "Node.js"
    
                rent_controller = component "RentController" "Interfaz entre la entrada y la lógica de dominio" "Express"
                rent_service = component "RentService" "Maneja la lógica de negocio de los alquileres" "Node.js"
                rent_repository = component "RentRepository" "Interfaz entre el módulo de alquileres y la base de datos" "Node.js"
                
                backend -> user_controller "Procesa solicitudes HTTP"
                backend -> car_controller "Procesa solicitudes HTTP"
                backend -> rent_controller "Procesa solicitudes HTTP"
                
                user_controller -> user_service "Llama a la lógica de negocio"
                user_service -> user_repository "Usa la capa de acceso a datos"
                user_repository -> database "Lee y escribe datos de usuarios"
    
                car_controller -> car_service "Llama a la lógica de negocio"
                car_service -> car_repository "Usa la capa de acceso a datos"
                car_repository -> database "Lee y escribe datos de autos"
    
                rent_controller -> rent_service "Llama a la lógica de negocio"
                rent_service -> rent_repository "Usa la capa de acceso a datos"
                rent_repository -> database "Lee y escribe datos de reservas" 
            }
            admin -> system.app "Utiliza el sistema para gestionar la información de los alquileres de autos"
            app -> database "Solicita los cambios a la base de datos"
            
        }
    }

    views {
        systemContext system "Diagram1" {
            include *
            autolayout lr
        }
        
        container system "Diagram2" {
            include *
            autolayout lr
        }
        
        component system.app "Diagram3" {
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
