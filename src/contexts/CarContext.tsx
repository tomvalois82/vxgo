
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Car, CarFormData } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Initial sample data
const initialCars: Car[] = [
  {
    id: '1',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    price: 120000,
    color: 'Prata',
    mileage: 0,
    fuelType: 'Flex',
    transmission: 'Automático',
    inStock: true,
    description: 'Modelo novo, completo com multimídia e câmera de ré.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    price: 115000,
    color: 'Branco',
    mileage: 15000,
    fuelType: 'Flex',
    transmission: 'Automático',
    inStock: true,
    description: 'Seminovo em excelente estado, único dono.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    brand: 'Volkswagen',
    model: 'Golf',
    year: 2020,
    price: 90000,
    color: 'Preto',
    mileage: 32000,
    fuelType: 'Flex',
    transmission: 'Automático',
    inStock: true,
    description: 'Completo com teto solar.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface CarContextType {
  cars: Car[];
  addCar: (car: CarFormData) => void;
  updateCar: (id: string, car: Partial<CarFormData>) => void;
  deleteCar: (id: string) => void;
  getCar: (id: string) => Car | undefined;
  filteredCars: Car[];
  setSearchTerm: (term: string) => void;
  searchTerm: string;
}

const CarContext = createContext<CarContextType | undefined>(undefined);

export const CarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to load cars from localStorage or use initialCars
  const [cars, setCars] = useState<Car[]>(() => {
    const savedCars = localStorage.getItem('carInventory');
    return savedCars ? JSON.parse(savedCars) : initialCars;
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  // Save cars to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('carInventory', JSON.stringify(cars));
  }, [cars]);

  const addCar = (carData: CarFormData) => {
    const newCar: Car = {
      ...carData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCars([...cars, newCar]);
  };

  const updateCar = (id: string, carData: Partial<CarFormData>) => {
    setCars(
      cars.map((car) =>
        car.id === id
          ? { ...car, ...carData, updatedAt: new Date() }
          : car
      )
    );
  };

  const deleteCar = (id: string) => {
    setCars(cars.filter((car) => car.id !== id));
  };

  const getCar = (id: string) => {
    return cars.find((car) => car.id === id);
  };

  // Filter cars based on search term
  const filteredCars = cars.filter((car) => {
    const searchFields = `${car.brand} ${car.model} ${car.year} ${car.color}`.toLowerCase();
    return searchFields.includes(searchTerm.toLowerCase());
  });

  return (
    <CarContext.Provider
      value={{
        cars,
        addCar,
        updateCar,
        deleteCar,
        getCar,
        filteredCars,
        setSearchTerm,
        searchTerm,
      }}
    >
      {children}
    </CarContext.Provider>
  );
};

export const useCars = () => {
  const context = useContext(CarContext);
  if (context === undefined) {
    throw new Error('useCars must be used within a CarProvider');
  }
  return context;
};
