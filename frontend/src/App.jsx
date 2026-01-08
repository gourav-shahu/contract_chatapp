import React, { useState, useEffect, useRef } from "react";
import { InteractionStatus } from "@azure/msal-browser"; 
import { useIsAuthenticated, useMsal } from "@azure/msal-react"; 
import { loginRequest } from "./authConfig";
import axios from "axios";
import { 
  LayoutDashboard, 
  Upload as UploadIcon, 
  MessageSquare, 
  Search, 
  FileText, 
  ArrowUp, 
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Loader2,
  X
} from "lucide-react";

// --- 1. LOGIN SCREEN (UPDATED FOR POPUP) ---
const LoginScreen = () => {
  const { instance, inProgress } = useMsal();

  const handleLogin = async () => {
    console.log("Login button clicked..."); // DEBUG LOG
    console.log("Current MSAL Status:", inProgress); // DEBUG LOG

    // If MSAL is already busy, don't try to open another popup
    if (inProgress !== InteractionStatus.None) {
        console.warn("MSAL is currently busy. Cannot start login.");
        return;
    }

    try {
      // CHANGED FROM loginRedirect TO loginPopup
      await instance.loginPopup(loginRequest);
      console.log("Login success!");
    } catch (e) {
      console.error("Login failed:", e);
      alert("Login failed. Check console for details.");
    }
  };

  const isLoading = inProgress !== InteractionStatus.None;

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <div className="hidden lg:flex w-1/2 bg-blue-600 text-white flex-col justify-center px-20">
        <h1 className="text-4xl font-bold mb-4">ContractFlow</h1>
        <p className="text-blue-100 text-lg mb-8">
          AI-powered contract analysis for modern legal teams. 
        </p>
        <div className="flex gap-4 text-sm font-medium text-blue-200">
          <div className="flex items-center gap-2"><ShieldCheck size={18}/> Enterprise Security</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={18}/> SOC2 Compliant</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-500">Sign in to your corporate account</p>
          </div>
          <div className="mt-8 space-y-6">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 px-4 py-4 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Connecting...</span>
              ) : (
                "Sign in with Microsoft Azure"
              )}
            </button>
            <p className="text-xs text-center text-gray-400">Secured by Azure Active Directory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. SIDEBAR NAVIGATION ---
const Sidebar = ({ activeTab, setActiveTab, onLogout }) => (
  <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full font-sans">
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800">ContractFlow</h1>
      <p className="text-xs text-gray-400 font-medium tracking-wide">CPG Edition</p>
    </div>
    <nav className="flex-1 px-4 space-y-2 mt-4">
      <NavItem icon={<LayoutDashboard size={20} />} label="All Contracts" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
      <NavItem icon={<UploadIcon size={20} />} label="Upload" active={activeTab === "upload"} onClick={() => setActiveTab("upload")} />
      <NavItem icon={<MessageSquare size={20} />} label="Chat" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
    </nav>
    <div className="p-4 mt-auto border-t border-gray-100">
      <button onClick={onLogout} className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
        <LogOut size={18} className="mr-3" /> Logout
      </button>
    </div>
  </div>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
  >
    <span className="mr-3">{icon}</span>{label}
  </button>
);

// --- 3. HELPER COMPONENTS ---
const ContractListPanel = ({ documents, selectedDocId, onSelect, searchTerm, setSearchTerm }) => (
  <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
    <div className="p-5 border-b border-gray-100">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Search contracts..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      {documents.filter(d => d.filename.toLowerCase().includes(searchTerm.toLowerCase())).map((doc) => (
        <div 
          key={doc.id}
          onClick={() => onSelect(doc.id)}
          className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${selectedDocId == doc.id ? "bg-blue-50/50 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"}`}
        >
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText size={18} className={selectedDocId == doc.id ? "text-blue-600" : "text-gray-400"} />
              <h3 className={`text-sm font-semibold truncate ${selectedDocId == doc.id ? "text-blue-900" : "text-gray-700"}`}>{doc.filename}</h3>
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- 4. CHAT SCREEN ---
const ChatScreen = ({ documents, selectedDocId, setSelectedDocId }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (selectedDocId) {
      axios.get(`http://localhost:8000/history/${selectedDocId}`)
        .then(res => setChatHistory(res.data))
        .catch(err => console.error(err));
    } else {
      setChatHistory([]);
    }
  }, [selectedDocId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory, isTyping]);

  const handleSend = async () => {
    if (!inputMsg.trim() || !selectedDocId) return;
    
    const newMsg = { role: "user", content: inputMsg };
    setChatHistory(prev => [...prev, newMsg]);
    setInputMsg("");
    setIsTyping(true);

    const formData = new FormData();
    formData.append("doc_id", selectedDocId);
    formData.append("message", newMsg.content);

    try {
      const res = await axios.post("http://localhost:8000/chat", formData);
      setChatHistory(prev => [...prev, { role: "bot", content: res.data.response }]);
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: "bot", content: "Error communicating with AI Foundry." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const selectedDocName = documents.find(d => d.id == selectedDocId)?.filename;

  return (
    <div className="flex flex-1 h-screen overflow-hidden bg-white">
      <ContractListPanel 
        documents={documents} 
        selectedDocId={selectedDocId} 
        onSelect={setSelectedDocId} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
      />
      <div className="flex-1 flex flex-col bg-gray-50/50 relative">
        {selectedDocId ? (
          <>
            <div className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
               <div><h2 className="text-sm font-bold text-gray-800">{selectedDocName}</h2></div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
              ))}
              {isTyping && (
                 <div className="flex justify-start animate-pulse">
                   <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-gray-400 text-sm italic">
                     <Loader2 className="animate-spin" size={16} /> AI is thinking...
                   </div>
                 </div>
              )}
            </div>
            <div className="p-6 bg-white border-t border-gray-200">
              <div className="relative flex items-center border border-gray-200 rounded-xl bg-white shadow-sm hover:border-blue-300 transition-colors">
                <input
                  className="w-full px-4 py-4 text-sm bg-transparent outline-none"
                  placeholder="Ask a question..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isTyping}
                />
                <button onClick={handleSend} disabled={isTyping} className={`p-2 mr-2 rounded-lg transition-colors ${isTyping ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </>
        ) : <div className="flex-1 flex items-center justify-center text-gray-400">Select a contract to chat</div>}
      </div>
    </div>
  );
};

// --- 5. UPLOAD SCREEN ---
const UploadScreen = ({ documents, fetchDocuments }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await axios.post("http://localhost:8000/upload", formData);
      setFiles([]); 
      fetchDocuments();
      alert("All files uploaded successfully to Unity Catalog!");
    } catch (e) {
      console.error(e);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 p-10 bg-gray-50 h-screen overflow-y-auto">
      <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Document Management</h2>
          <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-10 hover:border-blue-400 transition-colors">
              <UploadIcon size={32} className="text-blue-600 mb-4" />
              <p className="text-sm text-gray-500 mb-4">Drag & drop or click to select multiple files</p>
              
              <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 mb-4">
                Browse Files
              </label>

              {files.length > 0 && (
                <div className="w-full max-w-lg space-y-2 mb-4">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                      <span className="truncate text-gray-700">{f.name}</span>
                      <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}

              {files.length > 0 && (
                <button onClick={handleUpload} disabled={isUploading} className={`bg-blue-600 text-white px-6 py-2 rounded-lg font-medium ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}>
                  {isUploading ? "Uploading to Cloud..." : `Upload ${files.length} File(s)`}
                </button>
              )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                      <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Date</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {documents.map((doc) => (
                          <tr key={doc.id}><td className="px-6 py-4 flex items-center gap-2"><FileText size={16} className="text-blue-500"/> {doc.filename}</td><td className="px-6 py-4">Today</td></tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

// --- 6. AUTHENTICATED APP WRAPPER ---
const AuthenticatedApp = () => {
  const { instance } = useMsal();
  const [activeTab, setActiveTab] = useState("chat");
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const handleLogout = () => {
    // CHANGED TO LOGOUT POPUP (Better for preventing full page refresh loops)
    instance.logoutPopup().catch(e => console.error(e));
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get("http://localhost:8000/documents");
      setDocuments(res.data);
      if (!selectedDocId && res.data.length > 0) setSelectedDocId(res.data[0].id);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDocuments(); }, []);

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      {activeTab === "chat" && <ChatScreen documents={documents} selectedDocId={selectedDocId} setSelectedDocId={setSelectedDocId} />}
      {activeTab === "upload" && <UploadScreen documents={documents} fetchDocuments={fetchDocuments} />}
      {activeTab === "all" && <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">Dashboard view (Placeholder)</div>}
    </div>
  );
};

// --- 7. MAIN APP ---
function App() {
  const isAuthenticated = useIsAuthenticated();

  // If authenticated, show App. Else, show Login.
  return isAuthenticated ? <AuthenticatedApp /> : <LoginScreen />;
}

export default App;