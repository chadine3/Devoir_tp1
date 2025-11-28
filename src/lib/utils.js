import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper function to convert Set to Object for attacked squares
export function setToObject(set) {
  const obj = {};
  set.forEach(value => {
    obj[value] = true;
  });
  return obj;
}

// Helper function to convert Object to Set for attacked squares
export function objectToSet(obj) {
  const set = new Set();
  Object.keys(obj).forEach(key => {
    set.add(key);
  });
  return set;
}