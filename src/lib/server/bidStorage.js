import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BIDS_FILE_PATH = join(process.cwd(), 'src', 'bids.json');

/**
 * Load bids from JSON file
 * @returns {Array} Array of bid objects
 */
export function loadBidsFromFile() {
	try {
		if (!existsSync(BIDS_FILE_PATH)) {
			// Create empty bids file if it doesn't exist
			saveBidsToFile([]);
			return [];
		}
		
		const fileContent = readFileSync(BIDS_FILE_PATH, 'utf-8');
		const bids = JSON.parse(fileContent);
		
		// Ensure it's an array
		if (!Array.isArray(bids)) {
			console.warn('Bids file contains invalid data, initializing empty array');
			return [];
		}
		
		return bids;
	} catch (error) {
		console.error('Error loading bids from file:', error);
		return [];
	}
}

/**
 * Save bids to JSON file
 * @param {Array} bids - Array of bid objects to save
 * @returns {boolean} True if successful, false otherwise
 */
export function saveBidsToFile(bids) {
	try {
		// Ensure bids is an array
		if (!Array.isArray(bids)) {
			console.error('Bids must be an array');
			return false;
		}
		
		const jsonData = JSON.stringify(bids, null, 2);
		writeFileSync(BIDS_FILE_PATH, jsonData, 'utf-8');
		return true;
	} catch (error) {
		console.error('Error saving bids to file:', error);
		return false;
	}
}

/**
 * Add a new bid to the file
 * @param {Object} bid - Bid object to add
 * @returns {boolean} True if successful, false otherwise
 */
export function addBidToFile(bid) {
	try {
		const bids = loadBidsFromFile();
		
		// Find and remove any existing bid from same bidder for same player
		const filteredBids = bids.filter(existingBid => 
			!(existingBid.playerId === bid.playerId && existingBid.bidder.teamId === bid.bidder.teamId)
		);
		
		// Add the new bid
		filteredBids.push(bid);
		
		return saveBidsToFile(filteredBids);
	} catch (error) {
		console.error('Error adding bid to file:', error);
		return false;
	}
}

/**
 * Remove a bid from the file by ID
 * @param {string} bidId - ID of bid to remove
 * @returns {boolean} True if successful, false otherwise
 */
export function removeBidFromFile(bidId) {
	try {
		const bids = loadBidsFromFile();
		const filteredBids = bids.filter(bid => bid.id !== bidId);
		
		// Check if any bids were actually removed
		if (filteredBids.length === bids.length) {
			return false; // Bid not found
		}
		
		return saveBidsToFile(filteredBids);
	} catch (error) {
		console.error('Error removing bid from file:', error);
		return false;
	}
}

/**
 * Clear all bids from the file
 * @returns {number} Number of bids that were cleared
 */
export function clearAllBidsFromFile() {
	try {
		const bids = loadBidsFromFile();
		const clearedCount = bids.length;
		saveBidsToFile([]);
		return clearedCount;
	} catch (error) {
		console.error('Error clearing bids from file:', error);
		return 0;
	}
}