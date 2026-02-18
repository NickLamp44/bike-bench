import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Screens & Components
import WorkInProgressBanner from "./components/generic/workInProgress";
import Navbar from "./components/navigation/navBar";
import Footer from "./components/generic/footer";
import SignIn from "./components/uam/login";
import SignUp from "./components/uam/signup";
import BlogArticle from "./components/content/article/blogArticle";
import ShowCaseArticle from "./components/content/article/showCaseArticle";
import MerchItem from "./components/store/merchItem";

import Home from "./screens/home";
import Content from "./screens/content";
import Merch from "./screens/merch";
import Checkout from "./screens/checkOut";
import Profile from "./screens/profile";
import UserAccess from "./screens/uam";
import AdminDashboard from "./screens/admin";

// Cart Context
import { CartProvider } from "./context/cartContext";

// Stlying
import "./App.css";

// Render Function
function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          {/* <WorkInProgressBanner /> */}
          <Navbar />

          <main className="py-4">
            <Routes>
              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Home Page  */}
              <Route path="/" element={<Home />} />

              {/* Unified Content (blogs, guides, reviews, interviews, galleries, etc.) */}
              <Route path="/content" element={<Content />} />
              <Route path="/blog/:blogId" element={<BlogArticle />} />
              <Route path="/showcase/:showCaseId" element={<ShowCaseArticle />} />

              {/* Merch */}
              <Route path="/shop" element={<Merch />} />
              <Route path="/shop/:merchId" element={<MerchItem />} />
              <Route path="/checkout" element={<Checkout />} />

              {/* Acess Management */}
              <Route path="/uam" element={<UserAccess />} />
              <Route path="/auth" element={<UserAccess />} />
              <Route path="/login" element={<SignIn />} />
              <Route path="/signUp" element={<SignUp />} />

              {/* Profile */}
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
          {/* <Footer /> */}
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
