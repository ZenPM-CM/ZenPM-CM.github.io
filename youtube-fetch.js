export async function fetchYouTubeVideos(searchTerm = '', sortBy = 'date') {
    try {
        const videoGrid = document.querySelector('.video-grid');
        
        if (videoGrid) {
            // Show loading animation
            videoGrid.innerHTML = '<div class="loading-spinner"></div>';
            
            // Fetch channel info first
            const channelResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&id=UCjx70OSmQ1HMiUaS0p6hnkg&key=AIzaSyBPBH5DxfQbV5Mza13RrYx7wvpWznXLcw0`
            );
            const channelData = await channelResponse.json();
            
            if (!channelData.items || channelData.items.length === 0) {
                throw new Error('Channel not found');
            }
            
            // Update channel info section
            updateChannelInfo(channelData.items[0]);
            
            // Validate channel details
            if (!channelData.items[0].contentDetails || !channelData.items[0].contentDetails.relatedPlaylists) {
                throw new Error('Cannot access channel playlists');
            }
            
            const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
            
            if (!uploadsPlaylistId) {
                throw new Error('Uploads playlist not found');
            }
            
            // Fetch videos from uploads playlist
            const videosResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${uploadsPlaylistId}&key=AIzaSyBPBH5DxfQbV5Mza13RrYx7wvpWznXLcw0`
            );
            const videosData = await videosResponse.json();
            
            // Clear loading spinner
            videoGrid.innerHTML = '';
            
            if (!videosData.items || videosData.items.length === 0) {
                videoGrid.innerHTML = '<div class="error-message">No se encontraron videos</div>';
                return;
            }
            
            // Create a Set to track unique video IDs
            const uniqueVideoIds = new Set();
            
            // Filter videos to remove duplicates
            const uniqueVideos = videosData.items.filter(item => {
                const videoId = item.snippet.resourceId.videoId;
                if (!uniqueVideoIds.has(videoId)) {
                    uniqueVideoIds.add(videoId);
                    return true;
                }
                return false;
            });
            
            // Apply additional filtering if search term is provided
            let filteredVideos = uniqueVideos;
            if (searchTerm) {
                filteredVideos = uniqueVideos.filter(item => 
                    item.snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.snippet.description.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            
            // Sorting logic remains the same
            if (sortBy === 'views') {
                const videoIds = filteredVideos.map(item => item.snippet.resourceId.videoId).join(',');
                const statsResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=AIzaSyBPBH5DxfQbV5Mza13RrYx7wvpWznXLcw0`
                );
                const statsData = await statsResponse.json();
                
                const viewCountMap = {};
                statsData.items.forEach(item => {
                    viewCountMap[item.id] = parseInt(item.statistics.viewCount || '0');
                });
                
                filteredVideos.sort((a, b) => {
                    const aViews = viewCountMap[a.snippet.resourceId.videoId] || 0;
                    const bViews = viewCountMap[b.snippet.resourceId.videoId] || 0;
                    return bViews - aViews;
                });
            } else if (sortBy === 'date') {
                filteredVideos.sort((a, b) => {
                    return new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt);
                });
            }
            
            if (filteredVideos.length === 0) {
                videoGrid.innerHTML = '<div class="error-message">No se encontraron videos que coincidan con tu búsqueda</div>';
                return;
            }
            
            // Render videos with unique IDs
            for (const item of filteredVideos) {
                const videoData = item.snippet;
                const videoId = videoData.resourceId.videoId;
                
                // Fetch video statistics
                const statsResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=AIzaSyBPBH5DxfQbV5Mza13RrYx7wvpWznXLcw0`
                );
                const statsData = await statsResponse.json();
                
                // Extract statistics
                const views = statsData.items[0].statistics.viewCount;
                const likes = statsData.items[0].statistics.likeCount || '0';
                const comments = statsData.items[0].statistics.commentCount || '0';
                
                // Format large numbers with commas
                const formatNumber = (num) => {
                    return parseInt(num).toLocaleString();
                };
                
                // Full description
                const fullDescription = videoData.description;
                const shortDescription = fullDescription.length > 100 
                    ? fullDescription.substring(0, 100) + '...' 
                    : fullDescription;
                
                const videoElement = document.createElement('div');
                videoElement.classList.add('video-thumbnail', 'fade-in');
                videoElement.innerHTML = `
                    <div class="thumbnail-container">
                        <img src="${videoData.thumbnails.high.url}" alt="${videoData.title}" loading="lazy">
                        <div class="play-button">▶</div>
                    </div>
                    <h3>${videoData.title}</h3>
                    <p class="video-date">${new Date(videoData.publishedAt).toLocaleDateString()}</p>
                    <p class="video-description">${shortDescription}</p>
                    <p class="video-stats">
                        <span><i class="stats-icon">👁️</i> ${formatNumber(views)}</span>
                        <span><i class="stats-icon">👍</i> ${formatNumber(likes)}</span>
                        <span><i class="stats-icon">💬</i> ${formatNumber(comments)}</span>
                    </p>
                    <div class="video-buttons">
                        <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="btn video-btn">Ver Video</a>
                        <button class="btn detail-btn" data-video-id="${videoId}" data-full-description="${encodeURIComponent(fullDescription)}">Ver Detalles</button>
                    </div>
                `;
                videoGrid.appendChild(videoElement);
                
                // Trigger animation after a small delay
                setTimeout(() => {
                    videoElement.classList.add('visible');
                }, 100 * (videoGrid.children.length - 1));
            }
            
            // Add event listeners to detail buttons
            const detailButtons = document.querySelectorAll('.detail-btn');
            detailButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const videoId = this.getAttribute('data-video-id');
                    showVideoDetails(videoId);
                });
            });
        }
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        const videoGrid = document.querySelector('.video-grid');
        if (videoGrid) {
            videoGrid.innerHTML = `<div class="error-message">Error al cargar videos: ${error.message}</div>`;
        }
    }
}

// Function to display video details in a modal
function showVideoDetails(videoId) {
    // Check if modal already exists in the DOM, if not create it
    let modal = document.querySelector('.video-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'video-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <div id="video-container"></div>
                <div class="video-info">
                    <h2 id="modal-video-title"></h2>
                    <div class="video-meta">
                        <span id="modal-video-date"></span>
                        <div class="video-stats" id="modal-video-stats"></div>
                    </div>
                </div>
                <div class="tabs">
                    <button class="tab-btn active" data-tab="description">Descripción</button>
                    <button class="tab-btn" data-tab="comments">Comentarios</button>
                </div>
                <div class="tab-content">
                    <div class="tab-pane active" id="description-tab">
                        <div class="video-description" id="modal-video-description"></div>
                    </div>
                    <div class="tab-pane" id="comments-tab">
                        <div class="comment-filters">
                            <select id="comment-filter">
                                <option value="newest">Más Nuevos</option>
                                <option value="oldest">Más Antiguos</option>
                                <option value="popular">Más Populares</option>
                            </select>
                        </div>
                        <div class="comments-section" id="modal-comments-section">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Setup event listeners for modal
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', closeModal);

        // Close when clicking outside the modal content
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });

        // Setup tab switching
        const tabButtons = modal.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons and panes
                tabButtons.forEach(b => b.classList.remove('active'));
                const tabPanes = modal.querySelectorAll('.tab-pane');
                tabPanes.forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked button and corresponding pane
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.add('active');
                
                // If comments tab is clicked and not loaded yet, load comments
                if (this.getAttribute('data-tab') === 'comments' && 
                    document.getElementById('modal-comments-section').innerHTML === '<div class="loading-spinner"></div>') {
                    fetchVideoComments(videoId);
                }
            });
        });

        // Setup comment filter
        const commentFilter = modal.querySelector('#comment-filter');
        commentFilter.addEventListener('change', function() {
            fetchVideoComments(videoId, this.value);
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });
    }

    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling while modal is open
    
    // Load video iframe
    const videoContainer = document.getElementById('video-container');
    videoContainer.innerHTML = `
        <iframe width="100%" height="450" src="https://www.youtube.com/embed/${videoId}" 
        frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>
    `;
    
    // Fetch and display video details
    fetchVideoFullDetails(videoId);
    
    // Also load comments immediately (don't wait for tab click)
    fetchVideoComments(videoId);
}

// Function to close the modal
function closeModal() {
    const modal = document.querySelector('.video-details-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
        
        // Reset the video iframe to stop video playback
        const videoContainer = document.getElementById('video-container');
        videoContainer.innerHTML = '';
    }
}

// Function to fetch complete video details
async function fetchVideoFullDetails(videoId) {
    try {
        // Show loading state
        document.getElementById('modal-video-description').innerHTML = '<div class="loading-spinner"></div>';
        
        // Fetch video details
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=AIzaSyBPBH5DxfQbV5Mza13RrYx7wvpWznXLcw0`
        );
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            throw new Error('No se pudieron obtener los detalles del video');
        }
        
        const videoDetails = data.items[0];
        const snippet = videoDetails.snippet;
        const statistics = videoDetails.statistics;
        
        // Update modal with video details
        document.getElementById('modal-video-title').textContent = snippet.title;
        document.getElementById('modal-video-date').textContent = 
            `Publicado el ${new Date(snippet.publishedAt).toLocaleDateString()}`;
        
        // Format and display statistics
        const statsHtml = `
            <span><i class="stats-icon">👁️</i> ${parseInt(statistics.viewCount || 0).toLocaleString()} vistas</span>
            <span><i class="stats-icon">👍</i> ${parseInt(statistics.likeCount || 0).toLocaleString()} me gusta</span>
            <span><i class="stats-icon">💬</i> ${parseInt(statistics.commentCount || 0).toLocaleString()} comentarios</span>
        `;
        document.getElementById('modal-video-stats').innerHTML = statsHtml;
        
        // Display full description with formatting
        const descriptionHtml = snippet.description
            .replace(/\n/g, '<br>') // Convert newlines to HTML breaks
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>'); // Convert URLs to links
            
        document.getElementById('modal-video-description').innerHTML = descriptionHtml;
        
        // Load comments if comments tab is active
        const commentsTab = document.querySelector('.tab-btn[data-tab="comments"]');
        if (commentsTab.classList.contains('active')) {
            fetchVideoComments(videoId);
        }
        
    } catch (error) {
        console.error('Error fetching video details:', error);
        document.getElementById('modal-video-description').innerHTML = 
            `<div class="error-message">Error al cargar detalles: ${error.message}</div>`;
    }
}

// Function to fetch video comments
async function fetchVideoComments(videoId, sortBy = 'newest') {
    try {
        // Show loading state
        document.getElementById('modal-comments-section').innerHTML = '<div class="loading-spinner"></div>';
        
        // Determine sort order for the API
        let order = 'time'; // default is by time (newest)
        if (sortBy === 'oldest') {
            order = 'time'; // still time, but we'll reverse the array
        } else if (sortBy === 'popular') {
            order = 'relevance'; // YouTube's relevance includes popularity
        }
        
        // Fetch comments
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&order=${order}&maxResults=10&key=AIzaSyBPBH5DxfQbV5Mza13RrYx7wvpWznXLcw0`
        );
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            document.getElementById('modal-comments-section').innerHTML = 
                '<div class="no-comments">No hay comentarios disponibles para este video.</div>';
            return;
        }
        
        let comments = data.items.map(item => {
            const comment = item.snippet.topLevelComment.snippet;
            return {
                authorName: comment.authorDisplayName,
                authorProfileUrl: comment.authorProfileImageUrl,
                text: comment.textDisplay,
                likeCount: comment.likeCount,
                publishedAt: new Date(comment.publishedAt)
            };
        });
        
        // Sort comments based on selected option
        if (sortBy === 'oldest') {
            comments.reverse(); // Reverse for oldest first
        } else if (sortBy === 'popular') {
            comments.sort((a, b) => b.likeCount - a.likeCount);
        }
        
        // Generate HTML for comments
        let commentsHtml = '<ul class="comments-list">';
        comments.forEach(comment => {
            commentsHtml += `
                <li class="comment">
                    <div class="comment-header">
                        <img src="${comment.authorProfileUrl}" alt="${comment.authorName}" class="comment-avatar">
                        <span class="comment-author">${comment.authorName}</span>
                        <span class="comment-date">${comment.publishedAt.toLocaleDateString()}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-footer">
                        <span class="comment-likes"><i class="stats-icon">👍</i> ${comment.likeCount}</span>
                    </div>
                </li>
            `;
        });
        commentsHtml += '</ul>';
        
        document.getElementById('modal-comments-section').innerHTML = commentsHtml;
        
    } catch (error) {
        console.error('Error fetching comments:', error);
        document.getElementById('modal-comments-section').innerHTML = 
            `<div class="error-message">Error al cargar comentarios: ${error.message}</div>`;
    }
}

// Function to update channel info section
function updateChannelInfo(channelData) {
    const channelInfoContainer = document.querySelector('.channel-info');
    if (!channelInfoContainer) return;
    
    const snippet = channelData.snippet || {};
    const statistics = channelData.statistics || {};
    const banner = channelData.brandingSettings?.image?.bannerExternalUrl || '';
    
    let bannerHtml = '';
    if (banner) {
        bannerHtml = `<div class="channel-banner"><img src="${banner}" alt="Banner del canal"></div>`;
    }
    
    channelInfoContainer.innerHTML = `
        ${bannerHtml}
        <div class="channel-header">
            <div class="channel-avatar">
                <img src="${snippet.thumbnails?.default?.url || ''}" alt="${snippet.title || 'Canal'}">
            </div>
            <div class="channel-meta">
                <h2 class="channel-title">${snippet.title || 'Canal de YouTube'}</h2>
                <p class="channel-stats">
                    <span><i class="stats-icon">👥</i> ${parseInt(statistics.subscriberCount || 0).toLocaleString()} suscriptores</span>
                    <span><i class="stats-icon">🎬</i> ${parseInt(statistics.videoCount || 0).toLocaleString()} videos</span>
                    <span><i class="stats-icon">👁️</i> ${parseInt(statistics.viewCount || 0).toLocaleString()} vistas</span>
                </p>
            </div>
        </div>
        <div class="channel-description">
            <p>${snippet.description || 'Sin descripción disponible'}</p>
        </div>
    `;
}

// Function to initialize filters
export function initializeFilters() {
    const filterContainer = document.querySelector('.filter-container');
    if (!filterContainer) return;
    
    // Add event listener to search input
    const searchInput = document.getElementById('video-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const sortSelect = document.getElementById('sort-videos');
            const sortValue = sortSelect ? sortSelect.value : 'date';
            fetchYouTubeVideos(this.value, sortValue);
        }, 500));
    }
    
    // Add event listener to sort dropdown
    const sortSelect = document.getElementById('sort-videos');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const searchInput = document.getElementById('video-search');
            const searchValue = searchInput ? searchInput.value : '';
            fetchYouTubeVideos(searchValue, this.value);
        });
    }
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}