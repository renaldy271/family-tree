const API_URL = "http://localhost:3000";

// Fetch and display family members
async function loadFamilyTree() {
    const response = await fetch(`${API_URL}/members`);
    const members = await response.json();
  
    // Clear kategori sebelumnya
    ['grandparent', 'parent', 'child', 'grandchild'].forEach(category => {
      document.getElementById(`${category}-category`).innerHTML = '';
    });
  
    // Pisahkan anggota berdasarkan kategori
    members.forEach(member => {
      const memberCard = `
        <div class="col-md-4">
          <div class="card">
            <img src="${member.photo || 'https://via.placeholder.com/150'}" class="card-img-top" alt="Photo of ${member.name}">
            <div class="card-body text-center">
              <h5 class="card-title">${member.name}</h5>
              <p class = "card-text"> ${member.info}</p>
              <p class="card-text">${member.category}</p>
              <p class="card-text">${member.age} years old</p>
              <p class="card-text">${member.gender}</p>
              <button class="btn btn-primary btn-sm" onclick="editMember(${member.id})">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteMember(${member.id})">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `;
  
      document.getElementById(`${member.category}-category`).innerHTML += memberCard;
    });
  }

// Add or update member
async function saveMember(event) {
  event.preventDefault();
  const id = document.getElementById('member-id').value;
  const name = document.getElementById('name').value;
  const info = document.getElementById('info').value;
  const category = document.getElementById('category').value;
  const age = document.getElementById('age').value;
  const gender = document.getElementById('gender').value;
  const photoInput = document.getElementById('photo');

  let photoUrl = '';
  if (photoInput.files.length > 0) {
      console.log('Uploading new photo...'); // Debugging
      photoUrl = await uploadPhoto(photoInput.files[0]);
      console.log('Uploaded photo URL:', photoUrl); // Debugging
  } else {
      photoUrl = photoInput.getAttribute('data-existing-photo') || '';
      console.log('Using existing photo:', photoUrl); // Debugging
  }

  if (!name || !category || !age || !gender) {
      alert('Please fill all required fields!');
      return;
  }

  const payload = { name, info, category, age, gender, photo: photoUrl };
  console.log('Payload for save:', payload); // Debugging
  const method = id ? 'PUT' : 'POST';
  const endpoint = id ? `${API_URL}/members/${id}` : `${API_URL}/members`;
  console.log('API Endpoint:', endpoint); // Debugging

  try {
      const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
      });
      if (!response.ok) {
          throw new Error('Failed to save member');
      }
      console.log('Member saved successfully'); // Debugging
      alert('Member data saved successfully!');
      closeForm();
      loadFamilyTree();
  } catch (error) {
      console.error('Error saving member:', error);
      alert('Failed to save member!');
  }
}

// Delete member
async function deleteMember(id) {
  await fetch(`${API_URL}/members/${id}`, { method: 'DELETE' });
  loadFamilyTree();
}

// Open edit form
function editMember(id) {
  console.log('Fetching member with ID:', id); // Debugging
  fetch(`${API_URL}/members/${id}`)
      .then(response => {
          if (!response.ok) {
              throw new Error(`Failed to fetch member: ${response.status} ${response.statusText}`);
          }
          return response.json();
      })
      .then(member => {
          console.log('Fetched member:', member); // Debugging
          // Isi field form dengan data anggota
          document.getElementById('member-id').value = member.id;
          document.getElementById('name').value = member.name;
          document.getElementById('info').value = member.info;
          document.getElementById('category').value = member.category;
          document.getElementById('age').value = member.age;
          document.getElementById('gender').value = member.gender;

          // Set foto yang ada sebelumnya
          const photoInput = document.getElementById('photo');
          photoInput.setAttribute('data-existing-photo', member.photo || '');

          // Buka modal form
          openForm();
      })
      .catch(error => {
          console.error('Error fetching member:', error); // Debugging
          alert('Failed to load member data');
      });
}
  
// Open and close form
function openForm() {
  document.getElementById('form-modal').style.display = 'flex';
}

function closeForm() {
  document.getElementById('form-modal').style.display = 'none';
  document.getElementById('family-form').reset();
}

// Initialize
document.getElementById('family-form').addEventListener('submit', saveMember);
loadFamilyTree();

async function uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
  
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }
  
    const data = await response.json();
    return data.photoUrl; // URL file yang diunggah
  }
  