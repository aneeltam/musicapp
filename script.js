document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('search');

    // Fetch the top artists when the page loads
    fetchTopArtists();

    // Check the URL on page load to restore previous state if any
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');
    const artistName = params.get('artist');
    const albumName = params.get('album');

    if (query) {
        searchInput.value = query;
        fetchArtistData(query);
    } else if (artistName && albumName) {
        fetchAlbumTracks(artistName, albumName);
    } else if (artistName) {
        fetchAlbums(artistName);
    }

    // Search Button Event
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        fetchArtistData(query);
    });

    // Handle pressing Enter in the search box
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            fetchArtistData(query);
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const state = event.state;
            if (state.type === 'artistSearch') {
                fetchArtistData(state.query);
            } else if (state.type === 'albums') {
                fetchAlbums(state.artistName);
            } else if (state.type === 'tracks') {
                fetchAlbumTracks(state.artistName, state.albumName);
            }
        }
    });
});


async function fetchArtistData(query) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (!query) {
        resultsDiv.innerHTML = '<p>Please enter an artist name.</p>';
        return;
    }

    try {
        const apiKey = '3c38d949376a6f108ecc0ec2522f06e7';
        const url = `https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(query)}&api_key=${apiKey}&format=json`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Failed to fetch artist data.');

        const data = await response.json();
        const artists = data.results.artistmatches.artist;

        if (artists.length === 0) {
            resultsDiv.innerHTML = '<p>No results found.</p>';
            return;
        }

        artists.forEach(artist => {
            const artistCard = createArtistCard(artist);
            resultsDiv.appendChild(artistCard);
        });

        // Push the search state to history for the search query
        history.pushState({ type: 'artistSearch', query: query }, `Search results for ${query}`, `?query=${encodeURIComponent(query)}`);

    } catch (error) {
        resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}
function createTopArtistCard(artist) {
    const artistDiv = document.createElement('div');
    artistDiv.className = 'top-artist-card';

    const artistImage = artist.image?.find(img => img.size === 'large')?.['#text'] ||
        'https://via.placeholder.com/150?text=No+Image';

    artistDiv.innerHTML = `
        <div class="artist-image-container">
            <img src="${artistImage}" alt="${artist.name}" class="top-artist-img">
        </div>
        <h3 class="top-artist-name">${artist.name}</h3>
    `;

    return artistDiv;
}



async function fetchAlbums(artistName) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    try {
        const apiKey = '3c38d949376a6f108ecc0ec2522f06e7';
        const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=${encodeURIComponent(artistName)}&api_key=${apiKey}&format=json`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to fetch albums.');

        const data = await response.json();
        const albums = data.topalbums.album;

        if (albums.length === 0) {
            resultsDiv.innerHTML = '<p>No albums found.</p>';
            return;
        }

        albums.forEach(album => {
            const albumDiv = createAlbumCard(album);
            resultsDiv.appendChild(albumDiv);
        });

        // Push the artist and album data to history
        history.pushState({ type: 'albums', artistName: artistName }, `Albums for ${artistName}`, `?artist=${encodeURIComponent(artistName)}`);

    } catch (error) {
        resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function createAlbumCard(album) {
    const albumDiv = document.createElement('div');
    albumDiv.className = 'album-card';

    const albumImage = album.image?.find(img => img.size === 'medium')?.['#text'] ||
        'https://via.placeholder.com/150?text=No+Image';

    albumDiv.innerHTML = `
        <img src="${albumImage}" alt="${album.name}">
        <h4>${album.name}</h4>
        <div class="content"> <!-- Content section -->
            <p><strong>Artist:</strong> ${album.artist.name}</p>
            <!-- Add other content here, if needed -->
        </div>
        <button onclick="fetchAlbumTracks('${album.artist.name}', '${album.name}')">View Tracks</button>
    `;

    return albumDiv;
}


async function fetchAlbumTracks(artistName, albumName) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Loading album details...</p>';

    try {
        const apiKey = '3c38d949376a6f108ecc0ec2522f06e7';
        const url = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(albumName)}&api_key=${apiKey}&format=json`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to fetch album tracks.');

        const data = await response.json();
        const albumInfo = data.album;

        if (!albumInfo || !albumInfo.tracks) {
            resultsDiv.innerHTML = '<p>No tracks found for this album.</p>';
            return;
        }

        const tracks = Array.isArray(albumInfo.tracks.track)
            ? albumInfo.tracks.track
            : [albumInfo.tracks.track];

        const title = `<h2>${albumName} by ${artistName}</h2>`;
        const trackCards = tracks.map(track => `
            <div class="track-card">
                <p><strong>Track:</strong> ${track.name}</p>
                ${track.duration ? `<p><strong>Duration:</strong> ${Math.floor(track.duration / 60)}:${track.duration % 60}</p>` : ''}
            </div>
        `).join('');

        resultsDiv.innerHTML = `
            ${title}
            <h3>Tracks:</h3>
            <div class="track-container">
                ${trackCards}
            </div>
        `;

        // Push state for album tracks view
        history.pushState({ type: 'tracks', artistName: artistName, albumName: albumName }, `${albumName} tracks`, `?artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(albumName)}`);

    } catch (error) {
        resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function createArtistCard(artist) {
    const artistDiv = document.createElement('div');
    artistDiv.className = 'artist-card';

    // Check for Wikipedia image (using Wikipedia's API)
    const artistImage = artist.image?.find(img => img.size === 'large')?.['#text'] ||
        `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(artist.name)}?width=300`;  // Use Wikipedia image

    artistDiv.innerHTML = `
        <img src="${artistImage}" alt="${artist.name}">
        <h3>${artist.name}</h3>
        <div class="content">
            <p><strong>Listeners:</strong> ${artist.listeners}</p>
        </div>
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.innerHTML = `
        <button onclick="fetchAlbums('${artist.name}')">View Albums</button>
        <button onclick="fetchArtistBio('${artist.name}')">View Bio</button>
    `;
    artistDiv.appendChild(buttonContainer);

    return artistDiv;
}



async function fetchArtistBio(artistName) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Loading bio...</p>';

    try {
        const apiKey = '3c38d949376a6f108ecc0ec2522f06e7';
        const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${encodeURIComponent(artistName)}&api_key=${apiKey}&format=json`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to fetch artist bio.');

        const data = await response.json();
        const artist = data.artist;

        if (!artist || !artist.bio) {
            resultsDiv.innerHTML = '<p>No bio available for this artist.</p>';
            return;
        }

        // Update the artist image using Wikipedia (if available)
        const artistImage = `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(artist.name)}?width=300`;  // Wikipedia image

        const bioContent = `
            <h2>Bio for ${artist.name}</h2>
            <img src="${artistImage}" alt="${artist.name}" style="width: 300px; height: auto;">
            <p>${artist.bio.summary}</p>
            <a href="${artist.url}" target="_blank">More about ${artist.name}</a>
        `;
        resultsDiv.innerHTML = bioContent;

        // Push state for artist bio view
        history.pushState({ type: 'bio', artistName: artistName }, `${artist.name} bio`, `?artist=${encodeURIComponent(artistName)}&bio=true`);
    } catch (error) {
        resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

async function fetchTopArtists() {
    const topArtistsDiv = document.getElementById('top-artists-list');
    topArtistsDiv.innerHTML = '<p>Loading top artists...</p>';

    try {
        const apiKey = '3c38d949376a6f108ecc0ec2522f06e7';
        const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${apiKey}&format=json`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to fetch top artists.');

        const data = await response.json();
        const artists = data.artists.artist;

        if (artists.length === 0) {
            topArtistsDiv.innerHTML = '<p>No top artists found.</p>';
            return;
        }

        // Clear the loading message
        topArtistsDiv.innerHTML = '';

        // Loop through the first 10 artists only
        const top10Artists = artists.slice(0, 10);

        // Add artist cards for each top artist using the simplified function
        top10Artists.forEach(artist => {
            const artistCard = createTopArtistCard(artist);
            topArtistsDiv.appendChild(artistCard);
        });
    } catch (error) {
        topArtistsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('search');

    // Fetch the top artists when the page loads
    fetchTopArtists();

    // Check the URL on page load to restore previous state if any
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');
    const artistName = params.get('artist');
    const albumName = params.get('album');

    if (query) {
        searchInput.value = query;
        fetchArtistData(query);
    } else if (artistName && albumName) {
        fetchAlbumTracks(artistName, albumName);
    } else if (artistName) {
        fetchAlbums(artistName);
    }

    // Search Button Event
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        fetchArtistData(query);
    });

    // Handle pressing Enter in the search box
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            fetchArtistData(query);
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const state = event.state;
            if (state.type === 'artistSearch') {
                fetchArtistData(state.query);
            } else if (state.type === 'albums') {
                fetchAlbums(state.artistName);
            } else if (state.type === 'tracks') {
                fetchAlbumTracks(state.artistName, state.albumName);
            }
        }
    });
});
