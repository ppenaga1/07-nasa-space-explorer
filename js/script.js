// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesBtn = document.getElementById('getImagesBtn');
const gallery = document.getElementById('gallery');
const apodModal = document.getElementById('apodModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalImage = document.getElementById('modalImage');
const modalVideo = document.getElementById('modalVideo');
const modalVideoLink = document.getElementById('modalVideoLink');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const MODAL_FADE_MS = 250;

let currentGalleryItems = [];

// Your NASA API key for APOD requests
const NASA_API_KEY = 'ByovCbqXqRQIi3OhQTagv3j9AtguKAAjqGY2emTB';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Build the APOD URL with the selected date range
function buildApodUrl(startDate, endDate) {
	const params = new URLSearchParams({
		api_key: NASA_API_KEY,
		start_date: startDate,
		end_date: endDate,
		thumbs: 'true'
	});

	return `${APOD_URL}?${params.toString()}`;
}

// Show a simple loading message while waiting for NASA's response
function showLoadingState() {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🛰️</div>
			<p>Loading space images...</p>
		</div>
	`;
}

// Show an error message if something goes wrong
function showErrorState(message) {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">⚠️</div>
			<p>${message}</p>
		</div>
	`;
}

// Build one gallery card from an APOD item
function createGalleryCard(apodItem, index) {
	const card = document.createElement('article');
	card.className = 'gallery-item';
	card.dataset.index = String(index);

	const title = apodItem.title || 'Untitled';
	const date = apodItem.date || '';
	const explanation = apodItem.explanation || 'No description available.';

	// APOD can return videos too; we only render <img> tags for image entries
	if (apodItem.media_type === 'image') {
		const image = document.createElement('img');
		image.src = apodItem.url;
		image.alt = title;
		card.appendChild(image);
	} else if (apodItem.media_type === 'video') {
		if (apodItem.thumbnail_url) {
			const thumbnailImage = document.createElement('img');
			thumbnailImage.src = apodItem.thumbnail_url;
			thumbnailImage.alt = `${title} video thumbnail`;
			card.appendChild(thumbnailImage);
		} else {
			const videoPreview = document.createElement('div');
			videoPreview.className = 'video-preview';
			videoPreview.textContent = 'Video available';
			card.appendChild(videoPreview);
		}

		const mediaBadge = document.createElement('p');
		mediaBadge.className = 'media-badge';
		mediaBadge.textContent = 'VIDEO';
		card.appendChild(mediaBadge);
	}

	const titleText = document.createElement('p');
	titleText.innerHTML = `<strong>${title}</strong> (${date})`;

	const explanationText = document.createElement('p');
	explanationText.textContent = explanation;

	card.appendChild(titleText);
	card.appendChild(explanationText);

	setTimeout(() => {
		card.classList.add('is-visible');
	}, index * 70);

	return card;
}

// Render all APOD cards into the gallery
function renderGallery(apodItems) {
	const supportedItems = apodItems.filter((item) => item.media_type === 'image' || item.media_type === 'video');

	if (supportedItems.length === 0) {
		showErrorState('No image or video results were returned for this date range. Try different dates.');
		return;
	}

	// Show most recent items first
	supportedItems.sort((a, b) => new Date(b.date) - new Date(a.date));
	currentGalleryItems = supportedItems;

	gallery.innerHTML = '';

	supportedItems.forEach((item, index) => {
		const card = createGalleryCard(item, index);
		gallery.appendChild(card);
	});
}

// Fill and open the modal with a selected APOD image or video
function openModal(apodItem) {
	if (apodItem.media_type === 'video') {
		modalImage.classList.add('hidden');
		modalVideo.classList.remove('hidden');
		modalVideo.src = apodItem.url || '';
		modalVideoLink.classList.remove('hidden');
		modalVideoLink.href = apodItem.url || '#';
	} else {
		modalVideo.classList.add('hidden');
		modalVideo.src = '';
		modalVideoLink.classList.add('hidden');
		modalVideoLink.href = '#';
		modalImage.classList.remove('hidden');
		modalImage.src = apodItem.hdurl || apodItem.url;
		modalImage.alt = apodItem.title || 'NASA Astronomy Picture of the Day';
	}

	modalTitle.textContent = apodItem.title || 'Untitled';
	modalDate.textContent = apodItem.date || '';
	modalExplanation.textContent = apodItem.explanation || 'No description available.';

	apodModal.classList.remove('hidden');
	apodModal.setAttribute('aria-hidden', 'false');
}

// Hide modal and clear image source
function closeModal() {
	apodModal.classList.add('hidden');
	apodModal.setAttribute('aria-hidden', 'true');
	setTimeout(() => {
		if (apodModal.classList.contains('hidden')) {
			modalImage.src = '';
			modalVideo.src = '';
		}
	}, MODAL_FADE_MS);
}

// Fetch APOD data for the selected date range and render it
async function loadApodImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		showErrorState('Please select both a start date and an end date.');
		return;
	}

	showLoadingState();

	try {
		const requestUrl = buildApodUrl(startDate, endDate);
		const response = await fetch(requestUrl);

		if (!response.ok) {
			throw new Error(`NASA request failed with status ${response.status}`);
		}

		const data = await response.json();

		// If only one day is requested, NASA can return a single object instead of an array
		const apodItems = Array.isArray(data) ? data : [data];
		renderGallery(apodItems);
	} catch (error) {
		showErrorState('Something went wrong while loading NASA images. Please try again.');
		console.error('APOD request error:', error);
	}
}

// Click button to fetch and display APOD images
getImagesBtn.addEventListener('click', loadApodImages);

// Open modal when a gallery card is clicked
gallery.addEventListener('click', (event) => {
	const clickedCard = event.target.closest('.gallery-item');

	if (!clickedCard) {
		return;
	}

	const itemIndex = Number(clickedCard.dataset.index);
	const selectedItem = currentGalleryItems[itemIndex];

	if (!selectedItem) {
		return;
	}

	openModal(selectedItem);
});

// Close handlers: button, clicking overlay, and Escape key
closeModalBtn.addEventListener('click', closeModal);

apodModal.addEventListener('click', (event) => {
	if (event.target === apodModal) {
		closeModal();
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !apodModal.classList.contains('hidden')) {
		closeModal();
	}
});
