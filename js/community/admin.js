document.addEventListener('DOMContentLoaded', () => {
    // Check auth state and admin role
    auth.onAuthStateChanged(async user => {
        if (!user) {
            window.location.href = '../../auth/login.html';
            return;
        }
        
        // Verify admin role
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.data().role !== 'admin') {
            window.location.href = '../index.html';
            return;
        }
        
        // Load user data
        document.getElementById('user-name').textContent = userDoc.data().name || 'Admin';
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-role').textContent = 'Admin';
        
        // Setup navigation
        setupAdminNavigation();
        
        // Load initial section
        loadAdminSection('manage-posts');
    });
    
    // Logout button
    document.getElementById('logout-link').addEventListener('click', (e) => {
        e.preventDefault();
        logout().then(() => {
            window.location.href = '../../index.html';
        });
    });
});

function setupAdminNavigation() {
    const navLinks = document.querySelectorAll('.dashboard-nav a[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Load section
            const section = link.dataset.section;
            loadAdminSection(section);
        });
    });
}

function loadAdminSection(section) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(`${section}-section`).style.display = 'block';
    
    // Load section data
    switch (section) {
        case 'manage-posts':
            loadAllDiscussions();
            setupPostSearch();
            break;
        case 'manage-users':
            loadAllUsers();
            setupUserSearch();
            break;
        case 'reported-content':
            loadReportedContent();
            break;
        case 'author-applications':
            loadAuthorApplications();
            break;
    }
}

async function loadAllDiscussions() {
    const container = document.getElementById('all-discussions-list');
    container.innerHTML = '<p>Loading discussions...</p>';
    
    const snapshot = await db.collection('discussions')
        .orderBy('createdAt', 'desc')
        .get();
    
    if (snapshot.empty) {
        container.innerHTML = '<p>No discussions found.</p>';
        return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
        const discussion = doc.data();
        html += `
            <div class="admin-discussion-card" data-id="${doc.id}">
                <div class="discussion-info">
                    <h3><a href="../../community/discussion.html?id=${doc.id}">${discussion.title}</a></h3>
                    <p class="discussion-meta">
                        By ${discussion.author} | ${new Date(discussion.createdAt?.toDate()).toLocaleDateString()} | 
                        ${discussion.views || 0} views | ${discussion.comments || 0} comments
                    </p>
                </div>
                <div class="discussion-actions">
                    <button class="btn-sm ${discussion.isFeatured ? 'btn-featured' : 'btn-outline'}" 
                            onclick="toggleFeatured('${doc.id}', ${!discussion.isFeatured})">
                        ${discussion.isFeatured ? '★ Featured' : 'Make Featured'}
                    </button>
                    <button class="btn-sm btn-danger" onclick="deleteDiscussion('${doc.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function loadAllUsers() {
    const container = document.getElementById('users-list');
    container.innerHTML = '<p>Loading users...</p>';
    
    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
        container.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
        const user = doc.data();
        html += `
            <div class="user-card" data-id="${doc.id}">
                <div class="user-info">
                    <h3>${user.name || 'User'}</h3>
                    <p>${user.email} | ${user.role || 'user'}</p>
                    <p>Joined: ${new Date(user.createdAt?.toDate()).toLocaleDateString()}</p>
                </div>
                <div class="user-actions">
                    <select class="role-select" onchange="updateUserRole('${doc.id}', this.value)">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="author" ${user.role === 'author' ? 'selected' : ''}>Author</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    <button class="btn-sm ${user.banned ? 'btn-warning' : 'btn-danger'}" 
                            onclick="toggleUserBan('${doc.id}', ${!user.banned})">
                        ${user.banned ? 'Unban' : 'Ban'}
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function loadReportedContent() {
    const container = document.getElementById('reported-content-list');
    container.innerHTML = '<p>Loading reported content...</p>';
    
    // In a real implementation, you would have a 'reports' collection
    // This is a placeholder implementation
    container.innerHTML = `
        <div class="notification">
            <p>Reported content functionality would be implemented here.</p>
            <p>You would typically have a collection of reports with:</p>
            <ul>
                <li>Reported discussion/comments</li>
                <li>Reason for reporting</li>
                <li>Reporting user</li>
                <li>Timestamp</li>
            </ul>
            <p>With options to review, delete, or dismiss reports.</p>
        </div>
    `;
}

async function loadAuthorApplications() {
    const container = document.getElementById('applications-list');
    container.innerHTML = '<p>Loading applications...</p>';
    
    // In a real implementation, you would have an 'applications' collection
    // This is a placeholder implementation
    container.innerHTML = `
        <div class="notification">
            <p>Author applications functionality would be implemented here.</p>
            <p>You would typically have a collection with:</p>
            <ul>
                <li>Applicant information</li>
                <li>Application message</li>
                <li>Submission date</li>
                <li>Status (pending/approved/rejected)</li>
            </ul>
            <p>With options to approve or reject applications.</p>
        </div>
    `;
}

// Admin functions
window.toggleFeatured = async (discussionId, featured) => {
    await db.collection('discussions').doc(discussionId).update({
        isFeatured: featured
    });
    loadAllDiscussions();
};

window.deleteDiscussion = async (discussionId) => {
    if (confirm('Are you sure you want to delete this discussion?')) {
        await db.collection('discussions').doc(discussionId).delete();
        loadAllDiscussions();
    }
};

window.updateUserRole = async (userId, role) => {
    await db.collection('users').doc(userId).update({
        role: role
    });
};

window.toggleUserBan = async (userId, banned) => {
    await db.collection('users').doc(userId).update({
        banned: banned
    });
    loadAllUsers();
};

function setupPostSearch() {
    const searchInput = document.getElementById('post-search');
    searchInput.addEventListener('input', debounce(() => {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = document.getElementById('post-filter').value;
        
        const cards = document.querySelectorAll('.admin-discussion-card');
        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const matchesSearch = title.includes(searchTerm);
            const matchesFilter = filterValue === 'all' || 
                                (filterValue === 'featured' && card.querySelector('.btn-featured')) ||
                                (filterValue === 'reported' && card.dataset.reported === 'true');
            
            card.style.display = matchesSearch && matchesFilter ? 'flex' : 'none';
        });
    }, 300));
}

function setupUserSearch() {
    const searchInput = document.getElementById('user-search');
    searchInput.addEventListener('input', debounce(() => {
        const searchTerm = searchInput.value.toLowerCase();
        
        const cards = document.querySelectorAll('.user-card');
        cards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const email = card.querySelector('p').textContent.toLowerCase();
            const matches = name.includes(searchTerm) || email.includes(searchTerm);
            
            card.style.display = matches ? 'flex' : 'none';
        });
    }, 300));
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
                                                    }
