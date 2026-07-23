const { db, rDb } = require("./firebase/firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

// 20 Groups joined by the target user with unique descriptions
const JOINED_GROUPS = [
  {
    name: "Algorithms & Data Structures",
    subject: "Computer Science",
    maxMembers: 20,
    membersCount: 14,
    role: "Admin",
    active: true,
    description:
      "Master core algorithms, big-O analysis, sorting, search, and tree/graph structures for technical coding interviews and exams.",
  },
  {
    name: "Web Dev Mastery",
    subject: "Web Engineering",
    maxMembers: 15,
    membersCount: 9,
    role: "Member",
    description:
      "Building responsive, modern full-stack web applications using Node.js, Express, databases, and clean modern CSS layouts.",
  },
  {
    name: "Linear Algebra Prep",
    subject: "Mathematics",
    maxMembers: 10,
    membersCount: 7,
    role: "Member",
    description:
      "Studying vector spaces, eigenvalues, eigenvectors, linear transformations, and matrix operations for weekly problem sets.",
  },
  {
    name: "Machine Learning Fundamentals",
    subject: "Artificial Intelligence",
    maxMembers: 25,
    membersCount: 18,
    role: "Admin",
    description:
      "Exploring supervised/unsupervised learning, basic neural network architectures, and Python data science packages like Scikit-Learn.",
  },
  {
    name: "Operating Systems",
    subject: "Computer Science",
    maxMembers: 15,
    membersCount: 11,
    role: "Member",
    description:
      "Deep dive into process scheduling, virtual memory management, storage structures, file systems, and concurrency control.",
  },
  {
    name: "Organic Chemistry Exam Prep",
    subject: "Chemistry",
    maxMembers: 10,
    membersCount: 6,
    role: "Member",
    description:
      "Understanding complex organic reaction mechanisms, stereochemistry, synthesis pathways, and molecular orbital theory.",
  },
  {
    name: "English Literature Circle",
    subject: "Literature",
    maxMembers: 10,
    membersCount: 5,
    role: "Member",
    description:
      "Analyzing classic novels, historical contexts, literary themes, character development, and narrative structures.",
  },
  {
    name: "Thermodynamics Study Group",
    subject: "Physics",
    maxMembers: 15,
    membersCount: 8,
    role: "Admin",
    description:
      "Solving complex problems in heat transfer, thermodynamic cycles, entropy, and statistical mechanics equations.",
  },
  {
    name: "Database Systems",
    subject: "Software Engineering",
    maxMembers: 20,
    membersCount: 12,
    role: "Member",
    description:
      "Designing relational database schemas, normalization theory, indexing strategies, and writing advanced SQL queries.",
  },
  {
    name: "Calculus III",
    subject: "Mathematics",
    maxMembers: 15,
    membersCount: 10,
    role: "Member",
    description:
      "Collaborative study for multivariable calculus, partial derivatives, double/triple integrals, and Stokes' theorem.",
  },
  {
    name: "Network Security",
    subject: "Cybersecurity",
    maxMembers: 12,
    membersCount: 7,
    role: "Admin",
    description:
      "Analyzing cryptographic protocols, firewall systems, threat modeling, and secure enterprise network designs.",
  },
  {
    name: "French Language B2",
    subject: "Languages",
    maxMembers: 8,
    membersCount: 4,
    role: "Member",
    description:
      "Practicing advanced French grammar, listening comprehension, vocabulary expansion, and speaking fluency.",
  },
  {
    name: "Digital Signal Processing",
    subject: "Electronics",
    maxMembers: 15,
    membersCount: 9,
    role: "Member",
    description:
      "Working on Fourier transforms, z-transforms, digital filter designs, sampling theory, and discrete signals.",
  },
  {
    name: "Software Design Patterns",
    subject: "Software Engineering",
    maxMembers: 20,
    membersCount: 13,
    role: "Member",
    description:
      "Implementing creational, structural, and behavioral OOP patterns to write highly reusable and maintainable systems.",
  },
  {
    name: "Probability & Statistics",
    subject: "Mathematics",
    maxMembers: 15,
    membersCount: 8,
    role: "Admin",
    description:
      "Mastering probability distributions, hypothesis testing, confidence intervals, regression analysis, and variance.",
  },
  {
    name: "Cloud Computing AWS",
    subject: "DevOps",
    maxMembers: 20,
    membersCount: 16,
    role: "Member",
    description:
      "Preparing for AWS certifications, learning serverless architectures, and deploying secure scalable infrastructure.",
  },
  {
    name: "Discrete Mathematics",
    subject: "Computer Science",
    maxMembers: 10,
    membersCount: 6,
    role: "Member",
    description:
      "Solving mathematical proofs, set theory, combinatorics, graph theory, and mathematical induction tasks.",
  },
  {
    name: "Mobile App Development",
    subject: "Software Engineering",
    maxMembers: 15,
    membersCount: 11,
    role: "Admin",
    description:
      "Building native and cross-platform mobile apps with robust state management, routing, and local data persistence.",
  },
  {
    name: "Anatomy & Physiology",
    subject: "Medicine",
    maxMembers: 12,
    membersCount: 9,
    role: "Member",
    description:
      "Memorizing human organ systems, physiological mechanics, anatomical terminology, and histology slides.",
  },
  {
    name: "Macroeconomics",
    subject: "Economics",
    maxMembers: 10,
    membersCount: 7,
    role: "Member",
    description:
      "Analyzing global inflation, GDP indicators, fiscal policies, monetary systems, and international trade dynamics.",
  },
];

// 22 Available (unjoined) groups for exploration with unique descriptions
const AVAILABLE_GROUPS = [
  {
    name: "Quantum Mechanics & Relativity",
    subject: "Physics",
    maxMembers: 20,
    membersCount: 11,
    description:
      "Exploring wave-particle duality, wave functions, Schrodinger's equation, and Einstein's relativity theories.",
  },
  {
    name: "iOS Swift Development Boot Camp",
    subject: "Software Engineering",
    maxMembers: 25,
    membersCount: 14,
    description:
      "Learn Swift, Xcode, UIKit/SwiftUI, MVC/MVVM patterns, and APIs integration to build polished mobile applications.",
  },
  {
    name: "Biochemistry & Cellular Biology",
    subject: "Biology",
    maxMembers: 15,
    membersCount: 8,
    description:
      "Understanding cellular metabolic pathways, DNA replication, protein synthesis, and molecular signaling networks.",
  },
  {
    name: "Financial Accounting Basics",
    subject: "Business",
    maxMembers: 20,
    membersCount: 12,
    description:
      "Studying corporate balance sheets, income statements, general ledgers, and double-entry bookkeeping rules.",
  },
  {
    name: "Deep Learning & PyTorch",
    subject: "Artificial Intelligence",
    maxMembers: 30,
    membersCount: 22,
    description:
      "Building, training, and deploying convolutional neural networks, RNNs, and transformers using the PyTorch framework.",
  },
  {
    name: "International Law & Human Rights",
    subject: "Law",
    maxMembers: 15,
    membersCount: 9,
    description:
      "Discussing international treaties, sovereignty principles, human rights enforcement, and United Nations legal codes.",
  },
  {
    name: "Ancient History & Archaeology",
    subject: "History",
    maxMembers: 12,
    membersCount: 6,
    description:
      "Examining rise and fall of classical civilizations using archaeological findings, excavation reports, and historical texts.",
  },
  {
    name: "German Language C1 Advanced",
    subject: "Languages",
    maxMembers: 10,
    membersCount: 5,
    description:
      "Refining complex German grammar rules, high-level essays writing, and fluent conversational debates.",
  },
  {
    name: "Microbiology & Immunology",
    subject: "Medicine",
    maxMembers: 18,
    membersCount: 13,
    description:
      "Studying pathogen classifications, viral replication mechanisms, immune responses, and diagnostic techniques.",
  },
  {
    name: "Compiler Construction & Theory",
    subject: "Computer Science",
    maxMembers: 15,
    membersCount: 7,
    description:
      "Designing lexical scanners, grammar parsers, abstract syntax trees, and compiler optimization pipelines.",
  },
  {
    name: "Robotics & Kinematics",
    subject: "Engineering",
    maxMembers: 20,
    membersCount: 15,
    description:
      "Focusing on robotic joints kinematics, path planning algorithms, sensors feedback loops, and actuator controls.",
  },
  {
    name: "Behavioral Psychology Circle",
    subject: "Psychology",
    maxMembers: 25,
    membersCount: 16,
    description:
      "Analyzing human behavior conditioning, cognitive development theories, and social psychological experiment designs.",
  },
  {
    name: "Embedded Systems & IoT",
    subject: "Electronics",
    maxMembers: 15,
    membersCount: 10,
    description:
      "Programming microcontrollers in C/C++, RTOS, sensor interfacing, and building wireless IoT network protocols.",
  },
  {
    name: "Astrophysics Exploration",
    subject: "Physics",
    maxMembers: 20,
    membersCount: 12,
    description:
      "Studying celestial mechanics, stellar lifecycle structures, black holes, dark matter, and cosmology theories.",
  },
  {
    name: "Spanish Conversation Club",
    subject: "Languages",
    maxMembers: 15,
    membersCount: 11,
    description:
      "Immersive weekly speaking practice in Spanish. Discussing global topics, movies, books, and regional vocabulary.",
  },
  {
    name: "UI/UX & Interactive Design",
    subject: "Design",
    maxMembers: 25,
    membersCount: 19,
    description:
      "Learning user testing, wireframing, interactive prototyping, and modern design systems in Figma.",
  },
  {
    name: "Bioinformatics & Genomics",
    subject: "Computer Science",
    maxMembers: 15,
    membersCount: 8,
    description:
      "Using scripting languages to process genome sequences, search for alignments, and analyze phylogenetic trees.",
  },
  {
    name: "Game Development with Unity",
    subject: "Software Engineering",
    maxMembers: 30,
    membersCount: 21,
    description:
      "Developing 2D/3D games in Unity, writing C# scripts, managing asset pipelines, and using game physics engines.",
  },
  {
    name: "Public Speaking & Debate Prep",
    subject: "Communications",
    maxMembers: 15,
    membersCount: 9,
    description:
      "Developing effective speech delivery, rhetoric analysis, mock parliamentary debates, and impromptu speaking.",
  },
  {
    name: "Applied Cryptography & Web3",
    subject: "Cybersecurity",
    maxMembers: 20,
    membersCount: 14,
    description:
      "Studying blockchain ledger protocols, smart contract security, zero-knowledge proofs, and hash functions.",
  },
  {
    name: "Environmental Engineering Prep",
    subject: "Engineering",
    maxMembers: 15,
    membersCount: 8,
    description:
      "Analyzing wastewater treatments, clean energy setups, waste management, and sustainable civil planning.",
  },
  {
    name: "Philosophy of Science Seminar",
    subject: "Philosophy",
    maxMembers: 12,
    membersCount: 6,
    description:
      "Discussing scientific realism, paradigms shifts, logical positivism, and ethical boundaries of research.",
  },
];

// Diverse list of users with distinct, high-quality avatars (no female portraits, using male portraits, study objects, tech workspaces, and abstract designs)
const FAKE_USERS_POOL = [
  {
    fullName: "Karim Tahir",
    email: "karim@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Youcef Bensalem",
    email: "youcef@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Nabil Amrani",
    email: "nabil@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Sara Meghfour",
    email: "sara@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=150&h=150&q=80",
  }, // MacBook/study workspace
  {
    fullName: "Rania Larbi",
    email: "rania@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=150&h=150&q=80",
  }, // Coding laptop desk
  {
    fullName: "Lina Khelifi",
    email: "lina@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=150&h=150&q=80",
  }, // Code syntax screen
  {
    fullName: "Amine Belhadj",
    email: "amine@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Sofiane Drias",
    email: "sofiane@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1504257404782-b7b1348126e8?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Yanis Meziane",
    email: "yanis@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Meriem Ould",
    email: "meriem@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=150&h=150&q=80",
  }, // Math/algorithm blackboard
  {
    fullName: "Wassim Bouaziz",
    email: "wassim@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Anis Haddad",
    email: "anis@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Ryma Cheikh",
    email: "ryma@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=150&h=150&q=80",
  }, // Digital matrix code
  {
    fullName: "Mehdi Cherif",
    email: "mehdi@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Fatiha Zenati",
    email: "fatiha@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&h=150&q=80",
  }, // Motherboard/circuit board
  {
    fullName: "Adel Guendouz",
    email: "adel@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Samira Bensaid",
    email: "samira@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&h=150&q=80",
  }, // Globe/network data
  {
    fullName: "Walid Mansouri",
    email: "walid@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    fullName: "Selma Rahmani",
    email: "selma@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=150&h=150&q=80",
  }, // Laptop coding screen
  {
    fullName: "Tarek Yahia",
    email: "tarek@studyhype.com",
    photoURL:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80",
  },
];

// Returns unique members subset
function getRandomMembers(count = 3) {
  const shuffled = [...FAKE_USERS_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((user, idx) => ({
    uid: `fake-user-uid-${Math.random().toString(36).substring(7)}-${idx}`,
    fullName: user.fullName,
    photoURL: user.photoURL,
    email: user.email,
  }));
}

async function seedFakeGroups() {
  try {
    console.log(
      "🚀 Starting fast seeding of 20 joined groups + 22 unjoined available groups...",
    );

    // 1. Get Target User(s)
    const targetArg = process.argv[2];
    let targetUsers = [];

    if (targetArg) {
      const userSnap = await db
        .collection("users")
        .where("email", "==", targetArg)
        .get();
      if (!userSnap.empty) {
        targetUsers.push({
          uid: userSnap.docs[0].id,
          ...userSnap.docs[0].data(),
        });
      } else {
        const uidSnap = await db.collection("users").doc(targetArg).get();
        if (uidSnap.exists) {
          targetUsers.push({ uid: uidSnap.id, ...uidSnap.data() });
        }
      }
    }

    if (targetUsers.length === 0) {
      console.log(
        "📋 No specific target email/uid specified. Seeding to ALL existing users in Firestore...",
      );
      const usersSnap = await db.collection("users").get();
      usersSnap.docs.forEach((doc) => {
        targetUsers.push({ uid: doc.id, ...doc.data() });
      });
    }

    if (targetUsers.length === 0) {
      console.error(
        "❌ No users found in database to attach groups to. Please register/log in at least once.",
      );
      process.exit(1);
    }

    console.log(
      `👤 Seeding attached to ${targetUsers.length} user(s): ${targetUsers.map((u) => u.email || u.fullName || u.uid).join(", ")}`,
    );

    // --- Part A: Seeding Joined Groups ---
    console.log("\n📦 Seeding 20 Joined Groups...");
    for (const groupInfo of JOINED_GROUPS) {
      const mainUser = targetUsers[0];
      const creatorUid =
        groupInfo.role === "Admin"
          ? mainUser.uid
          : "fake-admin-" + Math.random().toString(36).substring(7);

      const existSnap = await db
        .collection("groups")
        .where("name", "==", groupInfo.name)
        .get();
      let groupId;

      // Select unique avatars for this specific card
      const assignedMembers = getRandomMembers(3);

      const groupDocData = {
        name: groupInfo.name,
        description: groupInfo.description,
        subject: groupInfo.subject,
        level: "Undergraduate",
        maxMembers: groupInfo.maxMembers,
        membersCount: groupInfo.membersCount,
        visibility: "Public",
        showInSearch: true,
        creationDate: new Date().toISOString(),
        creator: creatorUid,
        sampleMembers: [
          {
            uid: mainUser.uid,
            fullName: mainUser.fullName || "Abdelhamid Houari",
            photoURL: mainUser.photoURL || "",
          },
          ...assignedMembers.map((m) => ({
            uid: m.uid,
            fullName: m.fullName,
            photoURL: m.photoURL,
          })),
        ],
        currentSession: "",
      };

      if (!existSnap.empty) {
        groupId = existSnap.docs[0].id;
        await db.collection("groups").doc(groupId).update(groupDocData);
        console.log(`🔄 Updated joined group: ${groupInfo.name}`);
      } else {
        const docRef = await db.collection("groups").add(groupDocData);
        groupId = docRef.id;
        console.log(`✅ Created joined group: ${groupInfo.name}`);
      }

      for (const u of targetUsers) {
        await db
          .collection("groups")
          .doc(groupId)
          .collection("members")
          .doc(u.uid)
          .set({
            uid: u.uid,
            fullName: u.fullName || "Student",
            email: u.email || "",
            photoURL: u.photoURL || "",
          });
        await db
          .collection("users")
          .doc(u.uid)
          .collection("userGroupsIds")
          .doc(groupId)
          .set({});
      }

      for (const m of assignedMembers) {
        await db
          .collection("groups")
          .doc(groupId)
          .collection("members")
          .doc(m.uid)
          .set({
            uid: m.uid,
            fullName: m.fullName,
            email: m.email,
            photoURL: m.photoURL,
          });
      }

      // Seed Group Chat with avatars included inside sender
      const groupChatRef = rDb.ref(`groups/${groupId}/chat`);
      await groupChatRef.remove();
      const groupChatMessages = [
        {
          sender: {
            id: mainUser.uid,
            fullName: mainUser.fullName || "Abdelhamid Houari",
            photoURL:
              mainUser.photoURL ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
          },
          text: `Hey everyone! Glad to be part of ${groupInfo.name} 🚀`,
          offsetMins: 120,
        },
        {
          sender: {
            id: assignedMembers[0].uid,
            fullName: assignedMembers[0].fullName,
            photoURL: assignedMembers[0].photoURL,
          },
          text: "Welcome! We are organizing weekly review sessions and solving problems together.",
          offsetMins: 110,
        },
        {
          sender: {
            id: assignedMembers[1].uid,
            fullName: assignedMembers[1].fullName,
            photoURL: assignedMembers[1].photoURL,
          },
          text: "Let's share notes and help each other prep for upcoming exams 📚",
          offsetMins: 95,
        },
        {
          sender: {
            id: assignedMembers[2].uid,
            fullName: assignedMembers[2].fullName,
            photoURL: assignedMembers[2].photoURL,
          },
          text: "Sounds great! Feel free to ask any questions or propose topics.",
          offsetMins: 85,
        },
      ];
      for (const msg of groupChatMessages) {
        const newMsgRef = groupChatRef.push();
        await newMsgRef.set({
          sender: msg.sender,
          timestamp: Date.now() - msg.offsetMins * 60 * 1000,
          content: { text: msg.text },
          localId: `local-group-${Math.random()}`,
        });
      }

      if (groupInfo.active) {
        console.log(
          `🟢 Creating active session and quiz for ${groupInfo.name}...`,
        );

        const oldQuizzes = await db
          .collection("quizzes")
          .where("creator", "==", mainUser.uid)
          .get();
        for (const quizDoc of oldQuizzes.docs) {
          if (quizDoc.data().title === "Quick Check: Sorting Algorithms") {
            await db.collection("quizzes").doc(quizDoc.id).delete();
          }
        }

        const quizData = {
          title: "Quick Check: Sorting Algorithms",
          subject: "Computer Science",
          creator: mainUser.uid,
          sessionsCount: 1,
          groupsCount: 1,
          createdAt: new Date().toISOString(),
          questionsCount: 4,
          status: "published",
        };
        const quizRef = await db.collection("quizzes").add(quizData);
        const quizId = quizRef.id;

        const questionsList = [
          {
            text: "What is the average time complexity of Quick Sort?",
            choices: ["O(n²)", "O(n log n)", "O(log n)", "O(n)"],
            correctAnswerIndex: 1,
          },
          {
            text: "Which sorting algorithm is stable by default?",
            choices: [
              "Quick Sort",
              "Heap Sort",
              "Merge Sort",
              "Selection Sort",
            ],
            correctAnswerIndex: 2,
          },
          {
            text: "What is the worst-case time complexity of Bubble Sort?",
            choices: ["O(n log n)", "O(log n)", "O(n)", "O(n²)"],
            correctAnswerIndex: 3,
          },
          {
            text: "Which algorithm uses a divide-and-conquer approach?",
            choices: [
              "Insertion Sort",
              "Bubble Sort",
              "Merge Sort",
              "Selection Sort",
            ],
            correctAnswerIndex: 2,
          },
        ];

        for (const q of questionsList) {
          await quizRef.collection("questions").add(q);
        }

        await db
          .collection("groups")
          .doc(groupId)
          .collection("quizzesList")
          .doc(quizId)
          .set({
            title: quizData.title,
            questionsCount: quizData.questionsCount,
            createdAt: FieldValue.serverTimestamp(),
            sessionName: "Exam Prep — Sorting & Graph Algorithms",
          });

        const sessionData = {
          name: "Exam Prep — Sorting & Graph Algorithms",
          description:
            "Intensive 130-minute session focusing on sorting algorithms, graphs, dynamic programming, breaks, and mastery quiz.",
          duration: 130,
          startDate: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
          groupId: groupId,
          groupName: groupInfo.name,
          tasksCount: 9,
          joinedCount: 5,
          joinedUsers: [
            mainUser.uid,
            ...assignedMembers.map((m) => m.uid),
            `extra-fake-uid-${groupId}`,
          ],
          status: "active",
          quizId: quizId,
          updatedAt: new Date().toISOString(),
        };

        const sessionSnap = await db
          .collection("sessions")
          .where("groupId", "==", groupId)
          .get();
        const deleteBatch = db.batch();
        sessionSnap.docs.forEach((doc) => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();

        const sRef = await db.collection("sessions").add(sessionData);
        const sessionId = sRef.id;

        for (const q of questionsList) {
          await db
            .collection("sessions")
            .doc(sessionId)
            .collection("quizQuestions")
            .add(q);
        }

        await db
          .collection("groups")
          .doc(groupId)
          .update({ currentSession: sessionId });
        for (const u of targetUsers) {
          await db
            .collection("users")
            .doc(u.uid)
            .update({ currentSession: sessionId });
        }

        const tasksList = [
          {
            title: "Review Merge Sort & Quick Sort complexity",
            durationInMins: 15,
            status: "completed",
            index: 1,
            description:
              "Compare O(n log n) best/average case of Merge and Quick Sort with their worst-case performance under different pivot strategies.",
          },
          {
            title: "Solve LeetCode Two Sum & Contains Duplicate",
            durationInMins: 20,
            status: "completed",
            index: 2,
            description:
              "Focus on sliding window and two-pointer techniques to solve fundamental array and hash map challenges.",
          },
          {
            title: "5-Minute Coffee Break ☕",
            durationInMins: 5,
            status: "completed",
            index: 3,
            isBreak: true,
            description:
              "Take a short 5-minute break to grab coffee, hydrate, and stretch.",
          },
          {
            title: "Study BFS & DFS Graph Traversal",
            durationInMins: 20,
            status: "completed",
            index: 4,
            description:
              "Implement recursion-based Depth-First Search (DFS) and queue-based Breadth-First Search (BFS) on adjacency lists.",
          },
          {
            title: "Discuss Heap Sort vs Merge Sort",
            durationInMins: 15,
            status: "completed",
            index: 5,
            description:
              "Contrast memory requirements, in-place behavior, and stability differences between Heap Sort and Merge Sort.",
          },
          {
            title: "Practice Dynamic Programming (Knapsack, LCS)",
            durationInMins: 20,
            status: "active",
            index: 6,
            description:
              "Understand memoization and tabulation. Write optimal solutions for the 0/1 Knapsack and Longest Common Subsequence.",
          },
          {
            title: "10-Minute Recharge & Stretch Break 🧘‍♂️",
            durationInMins: 10,
            status: "pending",
            index: 7,
            isBreak: true,
            description:
              "Stand up, stretch your legs, and rest your eyes before starting our evaluation quiz.",
          },
          {
            title: "Sorting & Graph Algorithms Mastery Quiz",
            durationInMins: 15,
            status: "pending",
            index: 8,
            isQuiz: true,
            description:
              "Take the 15-minute interactive quiz to evaluate your understanding of sorting algorithms, stability, and graph traversals.",
          },
          {
            title: "Session Wrap-up & Homework Assignment",
            durationInMins: 10,
            status: "pending",
            index: 9,
            description:
              "Summarize today's achievements, share solution gists, and assign next week's practice challenges.",
          },
        ];

        const oldTasks = await db
          .collection("tasks")
          .where("sessionId", "==", sessionId)
          .get();
        const batch = db.batch();
        oldTasks.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();

        for (const t of tasksList) {
          await db.collection("tasks").add({
            title: t.title || "",
            durationInMins: t.durationInMins || 0,
            status: t.status || "pending",
            index: t.index,
            groupId,
            sessionId,
            isBreak: !!t.isBreak,
            isQuiz: !!t.isQuiz,
            description: t.description || "",
          });
        }

        const chatRef = rDb.ref(`sessions/${sessionId}/chat`);
        await chatRef.remove();

        const messages = [
          {
            sender: {
              id: mainUser.uid,
              fullName: mainUser.fullName || "Abdelhamid Houari",
              photoURL:
                mainUser.photoURL ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
            },
            text: "Welcome everyone! Today we have an intensive 130-minute session covering Sorting, Graphs, DP, plus a quiz and well-deserved breaks 💪",
            offsetMins: 78,
          },
          {
            sender: {
              id: assignedMembers[0].uid,
              fullName: assignedMembers[0].fullName,
              photoURL: assignedMembers[0].photoURL,
            },
            text: "Awesome roadmap! Let's knock out the Merge & Quick Sort complexity review first.",
            offsetMins: 76,
          },
          {
            sender: {
              id: assignedMembers[1].uid,
              fullName: assignedMembers[1].fullName,
              photoURL: assignedMembers[1].photoURL,
            },
            text: "Just finished Two Sum and Contains Duplicate on LeetCode! The two-pointer approach saved O(n) space.",
            offsetMins: 58,
          },
          {
            sender: {
              id: mainUser.uid,
              fullName: mainUser.fullName || "Abdelhamid Houari",
              photoURL:
                mainUser.photoURL ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
            },
            text: "Great job! That wraps up Tasks 1 and 2. Time for our 5-minute coffee break ☕ before we tackle graphs.",
            offsetMins: 55,
          },
          {
            sender: {
              id: assignedMembers[2].uid,
              fullName: assignedMembers[2].fullName,
              photoURL: assignedMembers[2].photoURL,
            },
            text: "Coffee break well spent 😄 I'm refreshed and ready for BFS/DFS traversal implementations.",
            offsetMins: 50,
          },
          {
            sender: {
              id: `extra-fake-uid-${groupId}`,
              fullName: "Youcef Bensalem",
              photoURL:
                "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80",
            },
            text: "Sharing my recursion tree notes for DFS vs queue for BFS. Graph traversal makes so much sense now!",
            offsetMins: 35,
          },
          {
            sender: {
              id: assignedMembers[0].uid,
              fullName: assignedMembers[0].fullName,
              photoURL: assignedMembers[0].photoURL,
            },
            text: "And Heap Sort vs Merge Sort discussion in Task 5 was super insightful regarding in-place memory usage.",
            offsetMins: 22,
          },
          {
            sender: {
              id: mainUser.uid,
              fullName: mainUser.fullName || "Abdelhamid Houari",
              photoURL:
                mainUser.photoURL ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
            },
            text: "Tasks 1 through 5 are marked completed ✅! Now we are on Task 6: Dynamic Programming (0/1 Knapsack and LCS).",
            offsetMins: 15,
          },
          {
            sender: {
              id: assignedMembers[1].uid,
              fullName: assignedMembers[1].fullName,
              photoURL: assignedMembers[1].photoURL,
            },
            text: "Working on the 2D tabulation grid for Knapsack right now. Let's finish strong before our 10-minute recharge break!",
            offsetMins: 10,
          },
          {
            sender: {
              id: assignedMembers[2].uid,
              fullName: assignedMembers[2].fullName,
              photoURL: assignedMembers[2].photoURL,
            },
            text: "Can't wait to test everything out on the Sorting & Graph Mastery Quiz right after the stretch break 🧠🔥",
            offsetMins: 5,
          },
          {
            sender: {
              id: `extra-fake-uid-${groupId}`,
              fullName: "Youcef Bensalem",
              photoURL:
                "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80",
            },
            text: "Let's do this! If anyone gets stuck on LCS state transitions, let me know.",
            offsetMins: 2,
          },
        ];

        for (const msg of messages) {
          const newMsgRef = chatRef.push();
          await newMsgRef.set({
            sender: msg.sender,
            timestamp: Date.now() - msg.offsetMins * 60 * 1000,
            content: { text: msg.text },
            localId: `local-${Math.random()}`,
          });
        }
        console.log(
          `💬 Populated live session chat messages, quiz, and tasks for ${groupInfo.name}!`,
        );
      }
    }

    // --- Part B: Seeding Available (Unjoined) Groups ---
    console.log("\n🌐 Seeding 22 Available (Unjoined) Groups...");
    for (const groupInfo of AVAILABLE_GROUPS) {
      const existSnap = await db
        .collection("groups")
        .where("name", "==", groupInfo.name)
        .get();
      let groupId;

      const fakeCreatorUid = `fake-creator-${Math.random().toString(36).substring(7)}`;

      // Select unique avatars for this specific card
      const assignedMembers = getRandomMembers(4);

      const groupDocData = {
        name: groupInfo.name,
        description: groupInfo.description,
        subject: groupInfo.subject,
        level: "Undergraduate",
        maxMembers: groupInfo.maxMembers,
        membersCount: groupInfo.membersCount,
        visibility: "Public",
        showInSearch: true,
        creationDate: new Date(
          Date.now() - Math.floor(Math.random() * 10) * 86400000,
        ).toISOString(),
        creator: fakeCreatorUid,
        sampleMembers: assignedMembers.map((m) => ({
          uid: m.uid,
          fullName: m.fullName,
          photoURL: m.photoURL,
        })),
        currentSession: "",
      };

      if (!existSnap.empty) {
        groupId = existSnap.docs[0].id;
        await db.collection("groups").doc(groupId).update(groupDocData);
        console.log(`🔄 Updated available group: ${groupInfo.name}`);
      } else {
        const docRef = await db.collection("groups").add(groupDocData);
        groupId = docRef.id;
        console.log(`✅ Created available group: ${groupInfo.name}`);
      }

      await db
        .collection("groups")
        .doc(groupId)
        .collection("members")
        .doc(fakeCreatorUid)
        .set({
          uid: fakeCreatorUid,
          fullName: assignedMembers[0].fullName,
          email: assignedMembers[0].email,
          photoURL: assignedMembers[0].photoURL,
        });

      for (const m of assignedMembers) {
        await db
          .collection("groups")
          .doc(groupId)
          .collection("members")
          .doc(m.uid)
          .set({
            uid: m.uid,
            fullName: m.fullName,
            email: m.email,
            photoURL: m.photoURL,
          });
      }

      for (const u of targetUsers) {
        await db
          .collection("groups")
          .doc(groupId)
          .collection("members")
          .doc(u.uid)
          .delete();
        await db
          .collection("users")
          .doc(u.uid)
          .collection("userGroupsIds")
          .doc(groupId)
          .delete();
      }
    }

    console.log(
      "\n🎉 Seeding completed successfully! 20 joined groups + 22 available groups are ready.",
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  }
}

seedFakeGroups();
