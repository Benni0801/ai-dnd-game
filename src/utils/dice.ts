/**
 * Utility functions for dice rolling in the D&D game
 */

/**
 * Rolls a dice with the specified number of sides
 * @param sides - Number of sides on the dice (e.g., 20 for d20)
 * @returns Random integer between 1 and sides (inclusive)
 */
export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Rolls multiple dice of the same type
 * @param count - Number of dice to roll
 * @param sides - Number of sides on each dice
 * @returns Array of dice results
 */
export function rollMultipleDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => rollDice(sides));
}

/**
 * Rolls a d20 (most common dice in D&D)
 * @returns Random integer between 1 and 20
 */
export function rollD20(): number {
  return rollDice(20);
}

/**
 * Calculates the total of multiple dice rolls
 * @param count - Number of dice to roll
 * @param sides - Number of sides on each dice
 * @returns Total sum of all dice rolls
 */
export function rollDiceTotal(count: number, sides: number): number {
  return rollMultipleDice(count, sides).reduce((sum, roll) => sum + roll, 0);
}





