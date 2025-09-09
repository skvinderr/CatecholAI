// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- DOM Elements ---
const welcomeModal = document.getElementById('welcomeModal');
const userName = document.getElementById('userName');
const startJourneyBtn = document.getElementById('startJourneyBtn');
const getStartedView = document.getElementById('getStartedView');
const wizardView = document.getElementById('wizardView');
const loadingView = document.getElementById('loadingView');
const resultsView = document.getElementById('resultsView');
const getStartedBtn = document.getElementById('getStartedBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const startOverBtn = document.getElementById('startOverBtn');
const recommendations = document.getElementById('recommendations');
const skillsModal = document.getElementById('skillsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalCareerTitle = document.getElementById('modalCareerTitle');
const modalBody = document.getElementById('modalBody');
const modalLoading = document.getElementById('modalLoading');
const modalContent = document.getElementById('modalContent');

const formSteps = [
    document.getElementById('form-step-1'),
    document.getElementById('form-step-2'),
    document.getElementById('form-step-3'),
];
const stepIndicators = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3'),
];

// --- State ---
let currentStep = 0;
let userData = {};
let currentUserName = '';

// --- Firebase Setup ---
const appId = 'catechol-career-advisor';
let firebaseConfig, db, auth, userId;

// You need to add your Firebase configuration here
try {
    // Replace this with your actual Firebase config
    firebaseConfig = {
        // Add your Firebase config object here
        apiKey: "your api key",
        authDomain: "catecholai.firebaseapp.com",
        projectId: "catecholai",
        storageBucket: "catecholai.firebasestorage.app",
        messagingSenderId: "939557938189",
        appId: "1:939557938189:web:c0ad26acb030a4240a6144",
        measurementId: "G-LEJM0QSZK6"
    };
    
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    onAuthStateChanged(auth, async user => {
        if (user) {
            userId = user.uid;
            console.log("User authenticated with ID:", userId);
        } else {
            try {
                await signInAnonymously(auth);
            } catch(error) {
                console.error("Authentication failed:", error);
                // Continue without Firebase if auth fails
                db = null;
                auth = null;
            }
        }
    });

} catch (error) {
    console.error("Firebase initialization failed:", error);
    console.log("App will work without data persistence");
    db = null;
    auth = null;
}

// --- Welcome Modal & Name Collection ---
userName.addEventListener('input', () => {
    const name = userName.value.trim();
    startJourneyBtn.disabled = name.length < 2;
    if (name.length >= 2) {
        startJourneyBtn.textContent = `Start My Journey, ${name}! ✨`;
    } else {
        startJourneyBtn.textContent = 'Start My Journey ✨';
    }
});

userName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !startJourneyBtn.disabled) {
        startJourneyBtn.click();
    }
});

startJourneyBtn.addEventListener('click', async () => {
    const name = userName.value.trim();
    if (name.length < 2) return;
    
    currentUserName = name;
    welcomeModal.classList.add('hidden');
    
    // Show the original get started view after name collection
    getStartedView.classList.remove('hidden');
    
    // Update header to personalize
    const header = document.querySelector('header h1');
    header.innerHTML = `Welcome ${name}! </br><span class="text-lg font-normal">Let's find your perfect career path</span>`;
    
    // Save user name to Firebase if available
    if (userId && db) {
        try {
            const userRef = doc(db, `users/${userId}`);
            await setDoc(userRef, {
                name: currentUserName,
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp()
            }, { merge: true });
            console.log("User name saved to Firebase");
        } catch (error) {
            console.error("Error saving user name:", error);
        }
    }
});

// --- Wizard Navigation ---
const updateWizardUI = () => {
    formSteps.forEach((step, index) => {
        step.classList.toggle('hidden', index !== currentStep);
    });
    stepIndicators.forEach((step, index) => {
        const span = step.querySelector('span:first-child');
        step.classList.toggle('step-active', index === currentStep);
        step.classList.toggle('text-gray-500', index !== currentStep);
        if(index < currentStep) {
             step.classList.add('step-completed', 'text-green-600');
             span.innerHTML = '&#10003;';
        } else {
             step.classList.remove('step-completed', 'text-green-600');
             span.innerText = index + 1;
        }
    });
    prevBtn.disabled = currentStep === 0;
    nextBtn.classList.toggle('hidden', currentStep === formSteps.length - 1);
    submitBtn.classList.toggle('hidden', currentStep !== formSteps.length - 1);
};

getStartedBtn.addEventListener('click', () => {
    getStartedView.classList.add('hidden');
    wizardView.classList.remove('hidden');
    updateWizardUI();
});

nextBtn.addEventListener('click', () => {
    if (currentStep < formSteps.length - 1) {
        currentStep++;
        updateWizardUI();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
        currentStep--;
        updateWizardUI();
    }
});

submitBtn.addEventListener('click', async () => {
    userData = {
        name: currentUserName,
        interests: document.getElementById('interests').value,
        academics: document.getElementById('academics').value,
        skills: document.getElementById('skills').value,
        timestamp: new Date().toISOString()
    };
    
    if (!userData.interests || !userData.academics) {
        alert("Please fill out your interests and academic strengths.");
        return;
    }

    // Save user responses to Firebase before getting recommendations
    if (userId && db) {
        try {
            const sessionRef = doc(db, `users/${userId}/sessions`, Date.now().toString());
            await setDoc(sessionRef, {
                userResponses: userData,
                createdAt: serverTimestamp(),
                status: 'processing'
            });
            console.log("User responses saved to Firebase");
        } catch (error) {
            console.error("Error saving responses:", error);
        }
    }

    wizardView.classList.add('hidden');
    loadingView.classList.remove('hidden');
    
    getCareerRecommendations(userData);
});

startOverBtn.addEventListener('click', () => {
    currentStep = 0;
    userData = {};
    currentUserName = '';
    document.getElementById('interests').value = '';
    document.getElementById('academics').value = '';
    document.getElementById('skills').value = '';
    userName.value = '';
    startJourneyBtn.disabled = true;
    startJourneyBtn.textContent = 'Start My Journey ✨';
    
    // Reset header
    const header = document.querySelector('header h1');
    header.innerHTML = 'Catechol AI Career Advisor';
    
    resultsView.classList.add('hidden');
    getStartedView.classList.add('hidden');
    welcomeModal.classList.remove('hidden');
    recommendations.innerHTML = '';
    updateWizardUI();
});

// --- Gemini API Calls ---
const callGemini = async (prompt, isJson = false) => {
    const apiKey = ""; // Add your Gemini API key here
    
    if (!apiKey) {
        console.error("Gemini API key is missing. Please add your API key to use the AI features.");
        return null;
    }
    
    const model = 'gemini-1.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        ...(isJson && {
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                     type: "OBJECT",
                     properties: {
                        "careers": {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    "title": { "type": "STRING" },
                                    "description": { "type": "STRING" },
                                    "reasoning": { "type": "STRING" }
                                },
                                 required: ["title", "description", "reasoning"]
                            }
                        }
                     },
                     required: ["careers"]
                }
            }
        })
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No content in API response.");
        return text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return null;
    }
};

const getCareerRecommendations = async (profile) => {
    const prompt = `
        Act as an expert career advisor for a student in India. Based on the following profile, recommend 3 to 5 diverse and relevant career paths. For each career, provide a title, a short description (2-3 sentences), and a brief reasoning (1-2 sentences) explaining why it's a good fit. Focus on modern and emerging roles in the Indian job market.

        Profile:
        - Interests: ${profile.interests}
        - Academic Strengths: ${profile.academics}
        - Existing Skills: ${profile.skills || 'None specified'}

        Return the response as a JSON object.
    `;
    
    const resultText = await callGemini(prompt, true);
    
    loadingView.classList.add('hidden');
    resultsView.classList.remove('hidden');
    
    if(resultText) {
        try {
             const data = JSON.parse(resultText);
             displayRecommendations(data.careers);
             
             // Save complete session with recommendations to Firebase
             if (userId && db) {
                 try {
                     const completedSessionRef = doc(db, `users/${userId}/completedSessions`, Date.now().toString());
                     await setDoc(completedSessionRef, {
                         userName: currentUserName,
                         userResponses: {
                             interests: profile.interests,
                             academics: profile.academics,
                             skills: profile.skills
                         },
                         recommendations: data.careers,
                         completedAt: serverTimestamp(),
                         status: 'completed'
                     });
                     console.log("Complete session saved to Firebase");
                 } catch (error) {
                     console.error("Error saving session:", error);
                 }
             }
        } catch(e) {
             console.error("Error parsing recommendations JSON", e);
             showDemoRecommendations();
        }
    } else {
         showDemoRecommendations();
    }
};

// Demo recommendations when API is not available
const showDemoRecommendations = () => {
    const demoData = {
        careers: [
            {
                title: "Software Developer",
                description: "Design, develop, and maintain software applications using various programming languages and technologies. Work on web applications, mobile apps, or desktop software for different industries.",
                reasoning: "Perfect for someone with problem-solving skills and interest in technology. High demand in India's growing tech sector."
            },
            {
                title: "Data Analyst",
                description: "Analyze large datasets to extract meaningful insights and support business decision-making. Use tools like Excel, SQL, Python, and visualization software to interpret data trends.",
                reasoning: "Great for analytical minds who enjoy working with numbers and patterns. Growing field with opportunities across all industries."
            },
            {
                title: "Digital Marketing Specialist",
                description: "Create and manage online marketing campaigns across social media, search engines, and other digital platforms. Focus on building brand awareness and driving customer engagement.",
                reasoning: "Ideal for creative individuals who understand social media and online trends. Rapidly expanding field in India's digital economy."
            },
            {
                title: "UI/UX Designer",
                description: "Design user interfaces and experiences for websites and mobile applications. Focus on making technology accessible, intuitive, and visually appealing for users.",
                reasoning: "Perfect combination of creativity and technical skills. High demand as companies focus on user experience."
            }
        ]
    };
    displayRecommendations(demoData.careers);
    
    // Add a notice about demo mode
    const notice = document.createElement('div');
    notice.className = 'bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4';
    notice.innerHTML = `
        <p class="text-yellow-800 text-sm">
            <strong>Demo Mode:</strong> These are sample recommendations. To get personalized AI-powered recommendations, please add your Gemini API key in the code.
        </p>
    `;
    recommendations.appendChild(notice);
};

const getSkillsRoadmap = async (careerTitle) => {
    modalLoading.style.display = 'block';
    modalContent.classList.add('hidden');
    modalContent.innerHTML = '';
    
    const prompt = `
        Create a detailed, actionable skills roadmap for a student in India aspiring to become a "${careerTitle}". The roadmap should be structured in markdown format.

        Include the following sections:
        1.  **Foundational Skills:** Core concepts and fundamental knowledge needed.
        2.  **Technical Skills:** Specific tools, programming languages, and software to master.
        3.  **Soft Skills:** Essential interpersonal skills for success in this role.
        4.  **Learning Path (Step-by-Step):** Suggest a sequence of learning, including types of online courses (mention platforms like Coursera, Udemy, NPTEL), certifications, and practical projects to build a portfolio.
        5.  **Indian Context:** Briefly mention top companies hiring for this role in India and relevant professional communities or networks.
    `;
    
    const roadmapMarkdown = await callGemini(prompt, false);

    modalLoading.style.display = 'none';
    if (roadmapMarkdown) {
        const converter = new showdown.Converter();
        const html = converter.makeHtml(roadmapMarkdown);
        modalContent.innerHTML = html;
        modalContent.classList.remove('hidden');
    } else {
        // Show demo roadmap if API is not available
        const demoRoadmap = getDemoSkillsRoadmap(careerTitle);
        const converter = new showdown.Converter();
        const html = converter.makeHtml(demoRoadmap);
        modalContent.innerHTML = html + `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p class="text-yellow-800 text-sm">
                    <strong>Demo Mode:</strong> This is sample content. For personalized AI-powered roadmaps, please add your Gemini API key.
                </p>
            </div>
        `;
        modalContent.classList.remove('hidden');
    }
};

const getDemoSkillsRoadmap = (careerTitle) => {
    return `# Skills Roadmap for ${careerTitle}

## Foundational Skills
- Problem-solving and analytical thinking
- Basic understanding of industry trends
- Communication and presentation skills
- Time management and project planning

## Technical Skills
- Industry-specific software and tools
- Programming languages (if applicable)
- Data analysis tools
- Digital collaboration platforms

## Soft Skills
- Leadership and teamwork
- Adaptability and continuous learning
- Client communication
- Creative thinking

## Learning Path (Step-by-Step)
1. **Start with basics**: Take online courses on platforms like Coursera, Udemy, or NPTEL
2. **Build projects**: Create a portfolio of relevant work
3. **Get certified**: Pursue industry-recognized certifications
4. **Network**: Join professional communities and attend industry events
5. **Gain experience**: Look for internships or entry-level positions

## Indian Context
- **Top Companies**: Major Indian companies and multinational corporations
- **Professional Networks**: LinkedIn groups and industry associations
- **Growth Opportunities**: Emerging trends in the Indian market

*Note: This is demo content. For personalized roadmaps, configure the Gemini API.*`;
};

// --- UI Rendering ---
const displayRecommendations = (careers) => {
    recommendations.innerHTML = '';
    if (!careers || careers.length === 0) {
         recommendations.innerHTML = `<div class="text-center bg-white p-8 rounded-lg shadow-md">
            <p class="text-gray-600">No recommendations could be generated. Try adjusting your profile.</p>
        </div>`;
         return;
    }
    careers.forEach(career => {
        const card = document.createElement('div');
        card.className = 'bg-white p-6 rounded-lg shadow-md border border-gray-200';
        card.innerHTML = `
            <h3 class="text-xl font-semibold text-indigo-700">${career.title}</h3>
            <p class="text-gray-600 mt-2">${career.description}</p>
            <p class="text-sm text-gray-500 mt-3"><strong>Why it's a good fit:</strong> ${career.reasoning}</p>
            <div class="mt-4 text-right">
                <button class="view-skills-btn bg-indigo-100 text-indigo-800 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-200 transition-colors" data-career="${career.title}">View Skills Roadmap</button>
            </div>
        `;
        recommendations.appendChild(card);
    });
};

// --- Modal Handling ---
recommendations.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-skills-btn')) {
        const careerTitle = e.target.dataset.career;
        modalCareerTitle.textContent = `Skills Roadmap for ${careerTitle}`;
        skillsModal.classList.remove('hidden');
        getSkillsRoadmap(careerTitle);
    }
});

closeModalBtn.addEventListener('click', () => {
    skillsModal.classList.add('hidden');
});

skillsModal.addEventListener('click', (e) => {
    if(e.target === skillsModal) {
         skillsModal.classList.add('hidden');
    }
});
