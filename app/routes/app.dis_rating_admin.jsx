

import { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Text,
  Button,
  Modal,
  TextField,
  Select,
  InlineStack,
  Autocomplete,
  Icon,
  Toast,
  Frame,
  FormLayout,
  Spinner,
} from '@shopify/polaris';
import { SearchIcon } from '@shopify/polaris-icons';
import { useLoaderData, useNavigate, useSubmit, useActionData, Form, useLocation } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import { json } from '@remix-run/node';
import prisma from "../db.server";
import {
  HomeOutlined,
  ProductOutlined,
  SettingOutlined,
  UserOutlined,
  MailOutlined,
  EditOutlined,
} from "@ant-design/icons";

const baseIconStyle = {
  fontSize: "24px",
  cursor: "pointer",
  border: "1px solid #96BF47",
  color: "#073E74",
  padding: "4px",
  borderRadius: "4px",
  width: "34px",
  height: "34px",
  transition: "background-color 0.3s ease",
};

const accountIconStyle = {
  width: "34px",
  height: "34px",
  cursor: "pointer",
  backgroundColor: "#073E74",
  padding: "4px",
  borderRadius: "4px",
  objectFit: "contain",
  transition: "transform 0.2s ease",
};

const formContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  padding: "2rem",
  background: "linear-gradient(145deg, #ffffff, #f5f7fa)",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  transition: "box-shadow 0.3s ease",
};

const inputWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  marginBottom: "1.5rem",
};

const inputContainerStyle = {
  borderRadius: "6px",
  padding: "4px",
  backgroundColor: "#F0F2F5",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  height: "44px",
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d9d9d9",
  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
};

const inputStyle = {
  border: "none",
  padding: "0.5rem",
  fontSize: "14px",
  fontFamily: "inherit",
  flex: 1,
  backgroundColor: "transparent",
  height: "100%",
  lineHeight: "1.5",
  outline: "none",
  color: "#333",
};

const detailStyle = {
  border: "none",
  padding: "0.5rem",
  backgroundColor: "transparent",
  flex: 1,
  fontSize: "14px",
  lineHeight: "1.5",
  height: "100%",
  color: "#333",
};

const detailItemStyle = {
  border: "1px solid #d9d9d9",
  borderRadius: "6px",
  padding: "0.5rem",
  backgroundColor: "#fff",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  justifyContent: "space-between",
  height: "44px",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.3s ease",
};

const nonEditableDetailItemStyle = {
  border: "1px solid #d9d9d9",
  borderRadius: "6px",
  padding: "0.5rem",
  backgroundColor: "#fff",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  height: "44px",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#2d3748",
  marginBottom: "0.25rem",
};

const errorStyle = {
  color: "#ff4d4f",
  fontSize: "12px",
  marginTop: "0.25rem",
};

const buttonStyle = {
  backgroundColor: "#1a202c",
  color: "#fff",
  borderRadius: "50px",
  padding: "0.5rem 1.5rem",
  fontSize: "14px",
  textAlign: "center",
  lineHeight: "1.2",
  border: "none",
  height: "40px",
  transition: "background-color 0.3s ease, transform 0.2s ease",
};

const detailIconStyle = {
  fontSize: "18px",
  color: "white",
  backgroundColor: "#073E74",
  padding: "4px",
  borderRadius: "4px",
  width: "45px",
  height: "45px",
};

const editIconStyle = {
  fontSize: "18px",
  color: "#073E74",
  cursor: "pointer",
  width: "34px",
  height: "34px",
  transition: "color 0.3s ease",
};

const shopImageStyle = {
  width: "34px",
  height: "34px",
  objectFit: "cover",
  backgroundColor: "#F0F2F5",
  borderRadius: "4px",
};

const buttonContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "1rem",
  marginTop: "1.5rem",
};

const tableStyles = {
  tableWrapper: {
    maxHeight: '75vh', // Increased from 60vh to 75vh
    overflowY: 'auto',
    overflowX: 'auto',
    position: 'relative',
  },
  reviewCell: {
    width: '200px', // You can adjust this if needed
    maxWidth: '200px', // Max width for the review column
    whiteSpace: 'normal', // Allow text to wrap
    wordBreak: 'break-word', // Ensure long words break
    '@media (max-width: 767px)': {
      width: '100px',
      maxWidth: '100px',
    },
  },
  reviewTitleCell: {
    maxWidth: '150px', // Max width for the review title column
    whiteSpace: 'normal', // Allow text to wrap
    wordBreak: 'break-word', // Ensure long words break
  },
  table: {
    width: '100%',
    tableLayout: 'auto',
  },
};

const FullScreenLoader = () => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
    }}
  >
    <Spinner accessibilityLabel="Loading" size="large" />
  </div>
);

export async function loader({ request }) {
  let shopDomain = null;
  try {
    const { session, admin } = await authenticate.admin(request);
    const url = new URL(request.url);
    shopDomain = session.shop || url.searchParams.get('shop');

    if (!shopDomain) {
      throw new Error('Shop domain not found in session or URL');
    }

    shopDomain = shopDomain.trim().toLowerCase().replace(/\/+$/, '');
    if (!shopDomain.endsWith('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    const account = await prisma.account.findFirst({
      where: { shop: shopDomain },
    });

    let serialKey = null;
    let settings = null;
    if (account) {
      serialKey = account.serialkey;
      const statusSetting = await prisma.settings.findUnique({
        where: { key: account.serialkey },
      });
      const displayStyleSetting = await prisma.settings.findUnique({
        where: { key: `${account.serialkey}_displayStyle` },
      });
      const reviewLimitSetting = await prisma.settings.findUnique({
        where: { key: `${account.serialkey}_reviewLimit` },
      });
      const reviewDisplayHeadingSetting = await prisma.settings.findUnique({
        where: { key: `${account.serialkey}_reviewDisplayHeading` },
      });
      const reviewFormHeadingSetting = await prisma.settings.findUnique({
        where: { key: `${account.serialkey}_reviewFormHeading` },
      });

      settings = {
        status: statusSetting?.value || "enabled",
        displayStyle: displayStyleSetting?.value || "grid",
        reviewLimit: reviewLimitSetting?.value || "5",
        reviewDisplayHeading: reviewDisplayHeadingSetting?.value || "Customer Reviews",
        reviewFormHeading: reviewFormHeadingSetting?.value || "Submit Your Reviews",
      };
    }

    // GraphQL query to fetch products
    const productsResponse = await admin.graphql(`
      query {
        products(first: 100) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `);

    const productsData = await productsResponse.json();
    const products = productsData.data.products.edges.map(({ node }) => ({
      id: node.id.split('/').pop(),
      title: node.title,
      handle: node.handle,
    }));

    return json({
      shopDomain,
      account,
      serialKey,
      settings,
      products,
      loaderError: null,
    });
  } catch (error) {
    return json({
      shopDomain,
      account: null,
      serialKey: null,
      settings: null,
      products: [],
      loaderError: `Failed to load data: ${error.message}`,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    if (!session?.shop) {
      throw new Error("Shop domain not found in session");
    }
    let shopDomain = session.shop;

    shopDomain = shopDomain.trim().toLowerCase().replace(/\/+$/, '');
    if (!shopDomain.endsWith('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    const formData = await request.formData();
    const actionType = formData.get("actionType");

    if (actionType === "delete") {
      const serialkey = formData.get("serialkey");
      if (!serialkey) {
        return json(
          { success: false, error: "Serial key is required for deletion" },
          { status: 400 }
        );
      }
      const account = await prisma.account.findUnique({
        where: { serialkey },
      });
      if (!account) {
        return json(
          { success: false, error: "Account not found" },
          { status: 404 }
        );
      }
      await prisma.$transaction([
        prisma.rating.deleteMany({
          where: { shop: account.shop },
        }),
        prisma.settings.deleteMany({
          where: { key: { startsWith: serialkey } },
        }),
        prisma.account.delete({
          where: { serialkey },
        }),
      ]);
      return json({ success: true, message: "Account deleted successfully" });
    } else if (actionType === "edit") {
      const serialkey = formData.get("serialkey");
      const username = formData.get("username");
      const email = formData.get("email");
      if (!serialkey) {
        return json(
          { success: false, error: "Serial key is required" },
          { status: 400 }
        );
      }
      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (Object.keys(updateData).length === 0) {
        return json(
          { success: false, error: "At least one field (username or email) is required" },
          { status: 400 }
        );
      }
      const updatedAccount = await prisma.account.update({
        where: { serialkey },
        data: {
          ...updateData,
          updatedat: new Date(),
        },
      });
      return json({ success: true, account: updatedAccount, message: "Account updated successfully" });
    } else if (actionType === "create") {
      const username = formData.get("username");
      const email = formData.get("email");
      if (!username || !email || !shopDomain) {
        return json(
          { success: false, error: "All fields (username, email, shop) are required" },
          { status: 400 }
        );
      }
      const existingAccount = await prisma.account.findFirst({
        where: { shop: shopDomain },
      });
      if (existingAccount) {
        return json(
          { success: true, account: existingAccount, message: "Account already exists for this shop" },
          { status: 200 }
        );
      }
      const serialkey = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const account = await prisma.account.create({
        data: {
          username,
          email,
          serialkey,
          shop: shopDomain,
          plan: 'free',
        },
      });
      await prisma.$transaction([
        prisma.settings.upsert({
          where: { key: serialkey },
          update: { value: "enabled" },
          create: { key: serialkey, value: "enabled" },
        }),
        prisma.settings.upsert({
          where: { key: `${serialkey}_displayStyle` },
          update: { value: "grid" },
          create: { key: `${serialkey}_displayStyle`, value: "grid" },
        }),
        prisma.settings.upsert({
          where: { key: `${serialkey}_reviewLimit` },
          update: { value: "5" },
          create: { key: `${serialkey}_reviewLimit`, value: "5" },
        }),
        prisma.settings.upsert({
          where: { key: `${serialkey}_reviewDisplayHeading` },
          update: { value: "Customer Reviews" },
          create: { key: `${serialkey}_reviewDisplayHeading`, value: "Customer Reviews" },
        }),
        prisma.settings.upsert({
          where: { key: `${serialkey}_reviewFormHeading` },
          update: { value: "Submit Your Reviews" },
          create: { key: `${serialkey}_reviewFormHeading`, value: "Submit Your Reviews" },
        }),
      ]);
      return json({ success: true, account, message: "Account created successfully" });
    }
    return json({ error: "Invalid action type" }, { status: 400 });
  } catch (error) {
    if (error.code === "P2002") {
      return json(
        {
          success: false,
          error: "Username, email, or serial settings already exists",
        },
        { status: 400 }
      );
    }
    return json(
      {
        success: false,
        error: "An error occurred while processing the request",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export default function RatingsAdminPage() {
  const { shopDomain, account, serialKey, settings, products, loaderError } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const submit = useSubmit();
  const location = useLocation();

  const [ratings, setRatings] = useState([]);
  const [filteredRatings, setFilteredRatings] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductTitle, setSelectedProductTitle] = useState('');
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ratingIdToDelete, setRatingIdToDelete] = useState(null);
  const [editingRating, setEditingRating] = useState(null);
  const [editFields, setEditFields] = useState({
    customerName: '',
    reviewTitle: '',
    review: '',
    star: '',
    status: 'approved',
    media: [],
    existingMedia: [],
  });
  const [updating, setUpdating] = useState(false);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [insertFields, setInsertFields] = useState({
    customerName: '',
    reviewTitle: '',
    review: '',
    star: '',
    status: 'approved',
    productId: '',
    productTitle: '',
    media: [],
  });
  const [inserting, setInserting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastError, setToastError] = useState(false);
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [starFilter, setStarFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [createdAtFromFilter, setCreatedAtFromFilter] = useState('');
  const [createdAtToFilter, setCreatedAtToFilter] = useState('');
  const [idFilter, setIdFilter] = useState(''); // For review ID filter
  const [reviewSortOption, setReviewSortOption] = useState('createdAt_desc'); // e.g., createdAt_desc, star_asc
  const [productOptions, setProductOptions] = useState([]);

  // States for product list filtering & sorting
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSortOption, setProductSortOption] = useState('title_asc'); // e.g., title_asc, title_desc, id_asc, id_desc
  const [filteredProducts, setFilteredProducts] = useState(products || []);

  // const [showMediaViewModal, setShowMediaViewModal] = useState(false); // Replaced
  // const [currentMediaToView, setCurrentMediaToView] = useState({ url: '', type: '' }); // Replaced
  const [showAllMediaModal, setShowAllMediaModal] = useState(false);
  const [currentReviewMediaPaths, setCurrentReviewMediaPaths] = useState([]);


  const [showAccount, setShowAccount] = useState(false);
  const [accountDetails, setAccountDetails] = useState({ username: "", email: "" });
  const [createdAccount, setCreatedAccount] = useState(account);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(!!account);
  const [isLoading, setIsLoading] = useState(false);

  const currentPath = location.pathname;

  const homeIconStyle = {
    ...baseIconStyle,
    backgroundColor: showAccount ? "#f0f0f0" : (currentPath === "/app" ? "#96BF47" : "#f0f0f0"),
  };

  const productIconStyle = {
    ...baseIconStyle,
    backgroundColor: showAccount ? "#f0f0f0" : (currentPath === "/app/dis_rating_admin" ? "#96BF47" : "#f0f0f0"),
  };

  const settingIconStyle = {
    ...baseIconStyle,
    backgroundColor: showAccount ? "#f0f0f0" : (currentPath === "/app/star-rating-settings" ? "#96BF47" : "#f0f0f0"),
  };

  const validateUsername = (username) => {
    if (!username) return "Username is required";
    return "";
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const handleUsernameChange = (value) => {
    setAccountDetails({ ...accountDetails, username: value });
    setUsernameError(validateUsername(value));
  };

  const handleEmailChange = (value) => {
    setAccountDetails({ ...accountDetails, email: value });
    setEmailError(validateEmail(value));
  };

  const handleEditClick = (field) => {
    setEditingField(field);
    setAccountDetails({
      username: field === "username" ? createdAccount?.username || "" : "",
      email: field === "email" ? createdAccount?.email || "" : "",
    });
    setUsernameError("");
    setEmailError("");
  };

  const handleEditAllClick = () => {
    setIsEditing(true);
    setEditingField(null);
    setAccountDetails({
      username: createdAccount?.username || "",
      email: createdAccount?.email || "",
    });
    setUsernameError("");
    setEmailError("");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setIsEditing(false);
    setAccountDetails({ username: "", email: "" });
    setUsernameError("");
    setEmailError("");
  };

  const handleSaveField = (field) => {
    if (field === "username" && validateUsername(accountDetails.username)) {
      setUsernameError(validateUsername(accountDetails.username));
      return;
    }
    if (field === "email" && validateEmail(accountDetails.email)) {
      setEmailError(validateEmail(accountDetails.email));
      return;
    }

    const formData = new FormData();
    formData.append("actionType", "edit");
    formData.append("serialkey", createdAccount?.serialkey);
    formData.append(field, accountDetails[field]);

    setIsLoading(true);
    submit(formData, { method: "post" });
  };

  const handleDeleteClick = () => {
    setShowDeleteAccountModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!shopDomain) {
      setToastMessage("Shop domain not detected. Please try again.");
      setToastError(true);
      return;
    }
    const formData = new FormData();
    formData.append("actionType", "delete");
    formData.append("serialkey", createdAccount?.serialkey);
    formData.append("shop", shopDomain);
    setIsLoading(true);
    submit(formData, { method: "post" });
    setShowDeleteAccountModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteAccountModal(false);
  };

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  function validateDate(dateStr) {
    if (!dateStr) return true;
    if (!dateRegex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handleDateBlur = useCallback(() => {
    const errors = [];
    if (createdAtFromFilter && createdAtToFilter) {
      if (!validateDate(createdAtFromFilter)) {
        errors.push('From Date is invalid. Use YYYY-MM-DD format (e.g., 2025-12-25).');
      }
      if (!validateDate(createdAtToFilter)) {
        errors.push('To Date is invalid. Use YYYY-MM-DD format (e.g., 2025-12-25).');
      }
      if (validateDate(createdAtFromFilter) && validateDate(createdAtToFilter)) {
        const fromDate = new Date(createdAtFromFilter);
        const toDate = new Date(createdAtToFilter);
        if (fromDate > toDate) {
          errors.push('From Date cannot be after To Date.');
        }
      }
      if (errors.length > 0) {
        setToastMessage(errors.join(' '));
        setToastError(true);
        setCreatedAtFromFilter('');
        setCreatedAtToFilter('');
      }
    }
  }, [createdAtFromFilter, createdAtToFilter]);

  function StarRating({ value, onChange }) {
    const stars = [1, 2, 3, 4, 5];
    const handleStarClick = (star) => {
      onChange(star.toString());
    };
    return (
      <InlineStack gap="100">
        {stars.map((star) => (
          <Button
            key={star}
            plain
            onClick={() => handleStarClick(star)}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Text
              as="span"
              tone={value && star <= parseInt(value) ? 'success' : 'subdued'}
              fontWeight={value && star <= parseInt(value) ? 'bold' : 'regular'}
            >
              {value && star <= parseInt(value) ? '★' : '☆'}
            </Text>
          </Button>
        ))}
      </InlineStack>
    );
  }

  function getShopFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    let shop = urlParams.get('shop') || shopDomain;
    if (shop) {
      shop = shop.trim().toLowerCase().replace(/\/+$/, '');
      if (!shop.endsWith('.myshopify.com')) {
        shop = `${shop}.myshopify.com`;
      }
    }
    return shop;
  }

  const toggleToast = useCallback(() => setToastMessage(null), []);

  const toastMarkup = toastMessage ? (
    <Toast content={toastMessage} error={toastError} onDismiss={toggleToast} />
  ) : null;

  const handleFileChange = useCallback((files, isEdit = false) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    if (isEdit) {
      setEditFields(prev => ({ ...prev, media: validFiles }));
    } else {
      setInsertFields(prev => ({ ...prev, media: validFiles }));
    }
  }, []);

  async function fetchReviews(productId) {
    const shop = getShopFromURL();
    if (!shop || !productId) {
      setError('Shop domain or product ID not found');
      setLoading(false);
      setRatings([]);
      setFilteredRatings([]);
      return;
    }
    setLoading(true);
    setError(null);
    setRatings([]);
    setFilteredRatings([]);
    try {
      const response = await fetch(`/dis-rating?shop=${encodeURIComponent(shop)}&productId=${encodeURIComponent(productId)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      const reviews = data.reviews || [];
      // Ensure reviews are for the correct productId
      const filteredReviews = reviews.filter(review => review.productId.toString() === productId.toString());
      setRatings(filteredReviews);
      setFilteredRatings(filteredReviews);
      if (filteredReviews.length === 0) {
        setToastMessage(`No reviews found for product ID: ${productId}`);
        setToastError(false);
      }
    } catch (err) {
      setError(`Failed to fetch reviews: ${err.message}`);
      setToastMessage(`Failed to fetch reviews: ${err.message}`);
      setToastError(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    const shop = getShopFromURL();
    if (!shop) {
      setError('Shop domain not found');
      return;
    }
    try {
      const response = await fetch(`/admin-product-title?shop=${encodeURIComponent(shop)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const productList = data.products.map((product) => ({
        id: product.id.toString(),
        title: product.title,
      }));
      setProductOptions(
        productList.map((product) => ({
          value: product.id,
          label: `${product.id} - ${product.title}`,
        }))
      );
    } catch (err) {
      setError(`Failed to fetch products: ${err.message}`);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleViewReviews = (productId, productTitle) => {
    setSelectedProductId(productId);
    setSelectedProductTitle(productTitle);
    setRatings([]); // Clear previous reviews
    setFilteredRatings([]); // Clear previous filtered reviews
    setShowReviewsModal(true);
    fetchReviews(productId);
  };

  useEffect(() => {
    if (actionData?.success) {
      if (actionData.message === "Account updated successfully") {
        setCreatedAccount(actionData.account);
        setAccountDetails({ username: "", email: "" });
        setUsernameError("");
        setEmailError("");
        setIsEditing(false);
        setEditingField(null);
        setToastMessage("Field updated successfully");
        setToastError(false);
      } else if (actionData.message === "Account created successfully") {
        setCreatedAccount(actionData.account);
        setAccountDetails({ username: "", email: "" });
        setUsernameError("");
        setEmailError("");
        setIsEditing(false);
        setEditingField(null);
        setIsContentVisible(true);
        setToastMessage(actionData.message);
        setToastError(false);
      } else if (actionData.message === "Account deleted successfully") {
        setCreatedAccount(null);
        setIsContentVisible(false);
        setShowAccount(false);
        setToastMessage(actionData.message);
        setToastError(false);
      }
    } else if (actionData?.error) {
      setToastMessage(actionData.error);
      setToastError(true);
    } else if (loaderError) {
      setToastMessage(loaderError);
      setToastError(true);
    }
    setIsLoading(false);
  }, [actionData, loaderError]);

  // Effect to filter and sort products
  useEffect(() => {
    if (!products) {
      setFilteredProducts([]);
      return;
    }

    let tempProducts = [...products];

    // Filtering
    if (productSearchTerm) {
      const lowercasedFilter = productSearchTerm.toLowerCase();
      tempProducts = tempProducts.filter(product =>
        product.id.toString().toLowerCase().includes(lowercasedFilter) ||
        product.title.toLowerCase().includes(lowercasedFilter) ||
        (product.handle && product.handle.toLowerCase().includes(lowercasedFilter))
      );
    }

    // Sorting
    const [sortKey, sortDirection] = productSortOption.split('_');
    tempProducts.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'id') {
        valA = parseInt(valA, 10);
        valB = parseInt(valB, 10);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredProducts(tempProducts);
  }, [productSearchTerm, products, productSortOption]);

  const productSortOptions = [
    { label: 'Title: A-Z', value: 'title_asc' },
    { label: 'Title: Z-A', value: 'title_desc' },
    { label: 'ID: Low to High', value: 'id_asc' },
    { label: 'ID: High to Low', value: 'id_desc' },
  ];

  const reviewSortOptions = [
    { label: 'Date: Newest First', value: 'createdAt_desc' },
    { label: 'Date: Oldest First', value: 'createdAt_asc' },
    { label: 'Rating: High to Low', value: 'star_desc' },
    { label: 'Rating: Low to High', value: 'star_asc' },
    { label: 'Customer Name: A-Z', value: 'customerName_asc' },
    { label: 'Customer Name: Z-A', value: 'customerName_desc' },
  ];

  const productRows = filteredProducts.map((product) => [
    product.id,
    product.title,
    product.handle,
    <Button
      onClick={() => handleViewReviews(product.id, product.title)}
      variant="primary"
      tone="monochrome"
    >
      View Reviews
    </Button>,
  ]);

  useEffect(() => {
    let result = [...ratings];
    if (createdAtFromFilter && !validateDate(createdAtFromFilter)) return;
    if (createdAtToFilter && !validateDate(createdAtToFilter)) return;
    if (customerNameFilter) {
      result = result.filter((r) =>
        r.customerName?.toLowerCase().includes(customerNameFilter.toLowerCase())
      );
    }
    if (idFilter) {
      result = result.filter((r) => r.id.toString() === idFilter);
    }
    if (starFilter) {
      result = result.filter((r) => r.star === Number(starFilter));
    }
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (authorFilter) {
      result = result.filter((r) => r.author === authorFilter);
    }
    if (createdAtFromFilter && validateDate(createdAtFromFilter)) {
      result = result.filter((r) => {
        const created = new Date(r.createdAt);
        return created >= new Date(createdAtFromFilter);
      });
    }
    if (createdAtToFilter && validateDate(createdAtToFilter)) {
      result = result.filter((r) => {
        const created = new Date(r.createdAt);
        return created <= new Date(createdAtToFilter);
      });
    }
    setFilteredRatings(result);
  }, [
    ratings,
    customerNameFilter,
    idFilter,
    starFilter,
    statusFilter,
    authorFilter,
    createdAtFromFilter,
    createdAtToFilter,
  ]);

  function handleOpenDeleteModal(ratingId) {
    setRatingIdToDelete(ratingId);
    setShowDeleteModal(true);
  }

  async function handleConfirmDelete() {
    setDeleting(ratingIdToDelete);
    try {
      const response = await fetch(`/delete-rating?id=${ratingIdToDelete}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setToastMessage('Rating deleted successfully');
      setToastError(false);
      fetchReviews(selectedProductId);
    } catch (err) {
      setToastMessage(`Delete failed: ${err.message}`);
      setToastError(true);
    } finally {
      setDeleting(null);
      setShowDeleteModal(false);
      setRatingIdToDelete(null);
    }
  }

  function handleEdit(rating) {
    let existingMedia = []; // Default to empty array
    if (rating.media && typeof rating.media === 'string') { // Ensure rating.media is a non-empty string
      try {
        const parsedMedia = JSON.parse(rating.media);
        if (Array.isArray(parsedMedia)) {
          existingMedia = parsedMedia;
        } else {
          console.error('Parsed media for edit is not an array:', parsedMedia, 'Original:', rating.media);
          // existingMedia remains []
        }
      } catch (e) {
        console.error('Failed to parse media for edit:', e, 'Original:', rating.media);
        // existingMedia remains []
      }
    } else if (rating.media) {
        // If rating.media exists but is not a string (e.g. already an array somehow, though unlikely from DB)
        console.warn('rating.media for edit was not a string:', rating.media);
        if (Array.isArray(rating.media)) {
            existingMedia = rating.media;
        }
        // existingMedia remains [] if not an array
    }

    setEditingRating(rating);
    setEditFields({
      customerName: rating.customerName || '',
      reviewTitle: rating.reviewTitle || '',
      review: rating.review || '',
      star: rating.star ? rating.star.toString() : '',
      status: rating.status || 'approved',
      media: [],
      existingMedia,
    });
  }

  async function handleUpdateSubmit() {
    const missingFields = [];
    if (!editFields.customerName) missingFields.push('Customer Name');
    if (!editFields.reviewTitle) missingFields.push('Review Title');
    if (!editFields.review) missingFields.push('Review');
    if (!editFields.star) missingFields.push('Star Rating');
    if (!editFields.status) missingFields.push('Status');
    const starValue = editFields.star ? Number(editFields.star) : 0;
    if (editFields.star && (starValue < 1 || starValue > 5)) {
      missingFields.push('Star Rating (must be 1–5)');
    }
    if (missingFields.length > 0) {
      setToastMessage(`Missing or invalid fields: ${missingFields.join(', ')}`);
      setToastError(true);
      return;
    }
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('id', editingRating.id);
      formData.append('customerName', editFields.customerName);
      formData.append('reviewTitle', editFields.reviewTitle);
      formData.append('review', editFields.review);
      formData.append('star', editFields.star);
      formData.append('status', editFields.status);
      formData.append('existingMedia', JSON.stringify(editFields.existingMedia));
      editFields.media.forEach(file => {
        formData.append('media', file);
      });

      const response = await fetch('/update-rating', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setToastMessage('Rating updated successfully');
      setToastError(false);
      fetchReviews(selectedProductId);
      setEditingRating(null);
    } catch (err) {
      let errorMessage = `Update failed: ${err.message}`;
      if (err.response && typeof err.response.json === 'function') {
        try {
          const errorData = await err.response.json();
          if (errorData.error && errorData.details) {
            errorMessage = `Update failed: ${errorData.error} - ${errorData.details}`;
          } else if (errorData.error) {
            errorMessage = `Update failed: ${errorData.error}`;
          }
        } catch (parseError) {
          // Could not parse JSON, stick with original err.message
          console.error("Could not parse error response JSON:", parseError);
        }
      } else if (err.message.includes("HTTP 500") && err.cause && err.cause.message) {
        // For some fetch errors, the actual server message might be in err.cause
         errorMessage = `Update failed: Server error - ${err.cause.message}`;
      }
      setToastMessage(errorMessage);
      setToastError(true);
    } finally {
      setUpdating(false);
    }
  }

  async function handleInsertSubmit() {
    const missingFields = [];
    if (!insertFields.customerName) missingFields.push('Customer Name');
    if (!insertFields.reviewTitle) missingFields.push('Review Title');
    if (!insertFields.review) missingFields.push('Review');
    if (!insertFields.star) missingFields.push('Star Rating');
    if (!insertFields.status) missingFields.push('Status');
    const starValue = insertFields.star ? Number(insertFields.star) : 0;
    if (insertFields.star && (starValue < 1 || starValue > 5)) {
      missingFields.push('Star Rating (must be 1–5)');
    }
    if (missingFields.length > 0) {
      setToastMessage(`Missing or invalid fields: ${missingFields.join(', ')}`);
      setToastError(true);
      return;
    }
    setInserting(true);
    try {
      const formData = new FormData();
      formData.append('customerName', insertFields.customerName);
      formData.append('reviewTitle', insertFields.reviewTitle);
      formData.append('review', insertFields.review);
      formData.append('star', insertFields.star);
      formData.append('status', insertFields.status);
      formData.append('productId', selectedProductId);
      formData.append('shop', getShopFromURL());
      formData.append('author', 'administrator');
      insertFields.media.forEach(file => {
        formData.append('media', file);
      });

      const response = await fetch('/add-rating', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      setToastMessage('Rating inserted successfully');
      setToastError(false);
      fetchReviews(selectedProductId);
      setInsertFields({
        customerName: '',
        reviewTitle: '',
        review: '',
        star: '',
        status: 'approved',
        productId: '',
        productTitle: '',
        media: [],
      });
      setShowInsertModal(false);
    } catch (err) {
      setToastMessage(`Insert failed: ${err.message}`);
      setToastError(true);
    } finally {
      setInserting(false);
    }
  }

  const rows = filteredRatings.map((rating) => {
    const product = products.find((p) => p.id === rating.productId.toString());
    const productDisplay = product
      ? `${product.title}`
      : rating.productId.toString();
    // console.log(`Rating ID: ${rating.id}, Media Data:`, rating.media); // Debug log removed
    let mediaDisplay = 'None';
    if (rating.media) {
      try {
        const mediaPaths = JSON.parse(rating.media);
        if (Array.isArray(mediaPaths) && mediaPaths.length > 0) {
          mediaDisplay = (
            <Button
              size="slim"
              onClick={() => {
                setCurrentReviewMediaPaths(mediaPaths);
                setShowAllMediaModal(true);
              }}
            >
              View All Media ({mediaPaths.length})
            </Button>
          );
        } else {
          mediaDisplay = 'No media';
        }
      } catch (e) {
        console.error("Error parsing media data:", e, rating.media);
        mediaDisplay = 'Invalid media data';
      }
    }

    return [
      // rating.id,
      rating.customerName,
      productDisplay,
      '★'.repeat(rating.star) + '☆'.repeat(5 - rating.star),
      rating.reviewTitle || '',
      <div title={rating.review} style={{ maxWidth: '200px', whiteSpace: 'normal'}}>
        {rating.review}
      </div>,
      rating.status,
      formatDate(rating.createdAt),
      mediaDisplay,
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button
          onClick={() => handleOpenDeleteModal(rating.id)}
          variant="primary"
          tone="critical"
          loading={deleting === rating.id}
        >
          Delete
        </Button>
        <Button
          onClick={() => handleEdit(rating)}
          variant="primary"
          tone="monochrome"
        >
          Edit
        </Button>
      </div>,
    ];
  });

  if (loaderError || !account) {
    return (
      <Frame>
        <Page title="Ratings Management">
          <Layout>
            <Layout.Section>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: "flex", gap: "1rem" }}>
                  <HomeOutlined
                    style={homeIconStyle}
                    onClick={() => {
                      setShowAccount(false);
                      navigate('/app?shop=${encodeURIComponent(shopDomain)}');
                    }}
                  />
                  <SettingOutlined
                    style={settingIconStyle}
                    onClick={() => {
                      setShowAccount(false);
                      navigate('/app/star-rating-settings?shop=${encodeURIComponent(shopDomain)}');
                      }}
                  />
                  <ProductOutlined
                    style={productIconStyle}
                    onClick={() => {
                      setShowAccount(false);
                      navigate('/app/dis_rating_admin?shop=${encodeURIComponent(shopDomain)}');
                      }}
                  />
                </div>
                {account && (
                  <div>
                    <img src="/account.png" alt="Account" style={accountIconStyle} onClick={() => { setShowAccount(true); setIsContentVisible(true); }} />
                  </div>
                )}
              </div>
            </Layout.Section>
            <Layout.Section>
              <div style={formContainerStyle}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Text as="h3" variant="headingMd" fontWeight="bold" tone="critical">
                    Please create an account first
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued" style={{ marginTop: "1rem" }}>
                    No account found for shop: {shopDomain || 'unknown'}. Create an account to proceed.
                  </Text>
                </div>
                {isContentVisible && showAccount ? (
                  <div style={formContainerStyle}>
                    <Text as="p" variant="bodyMd" tone="subdued" style={{ marginBottom: "0.5rem" }}>
                      Add Account Details
                    </Text>
                    <Form method="post">
                      <input type="hidden" name="actionType" value="create" />
                      <input type="hidden" name="shop" value={shopDomain} />
                      <div style={inputWrapperStyle}>
                        <label htmlFor="username" style={labelStyle}>Username</label>
                        <div style={inputContainerStyle}>
                          <UserOutlined style={detailIconStyle} />
                          <TextField
                            id="username"
                            name="username"
                            placeholder="Enter username"
                            required
                            value={accountDetails.username}
                            onChange={handleUsernameChange}
                            error={usernameError}
                            inputMode="text"
                            style={inputStyle}
                          />
                        </div>
                        {usernameError && (
                          <Text as="p" style={errorStyle}>
                            {usernameError}
                          </Text>
                        )}
                      </div>
                      <div style={inputWrapperStyle}>
                        <label htmlFor="email" style={labelStyle}>Email</label>
                        <div style={inputContainerStyle}>
                          <MailOutlined style={detailIconStyle} />
                          <TextField
                            id="email"
                            type="email"
                            name="email"
                            placeholder="Enter email"
                            required
                            value={accountDetails.email}
                            onChange={handleEmailChange}
                            error={emailError}
                            inputMode="email"
                            style={inputStyle}
                          />
                        </div>
                        {emailError && (
                          <Text as="p" style={errorStyle}>
                            {emailError}
                          </Text>
                        )}
                      </div>
                      {actionData?.error && (
                        <Text as="p" style={{ ...errorStyle, marginBottom: "1rem" }}>
                          {actionData.error}
                        </Text>
                      )}
                      <div style={buttonContainerStyle}>
                        <Button
                          variant="primary"
                          submit
                          disabled={!accountDetails.username || !accountDetails.email || usernameError || emailError || isLoading}
                          loading={isLoading}
                          style={buttonStyle}
                        >
                          Save Account
                        </Button>
                      </div>
                    </Form>
                  </div>
                ) : (
                  <div style={{ marginTop: "1.5rem" }}>
                    <center>
                      <Button
                        variant="primary"
                        size="large"
                        onClick={() => {
                          setIsContentVisible(true);
                          setShowAccount(false);
                          navigate(`/app?shop=${encodeURIComponent(shopDomain)}`);
                        }}
                        style={buttonStyle}
                      >
                        Create Account
                      </Button>
                    </center>
                  </div>
                )}
              </div>
            </Layout.Section>
          </Layout>
          {toastMarkup}
          {isLoading && <FullScreenLoader />}
        </Page>
      </Frame>
    );
  }

 return (
    <Frame>
      {loaderError || !account ? (
        <Page title="Ratings Management">
          <Layout>
            <Layout.Section>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: "flex", gap: "1rem" }}>
                  <HomeOutlined
                    style={homeIconStyle}
                    onClick={() => {
                      setShowAccount(false);
                      navigate(`/app?shop=${encodeURIComponent(shopDomain)}`);
                    }}
                  />
                  <SettingOutlined
                    style={settingIconStyle}
                    onClick={() => {
                      setShowAccount(false);
                      navigate(`/app/star-rating-settings?shop=${encodeURIComponent(shopDomain)}`);
                    }}
                  />
                  <ProductOutlined
                    style={productIconStyle}
                    onClick={() => {
                      setShowAccount(false);
                      navigate(`/app/dis_rating_admin?shop=${encodeURIComponent(shopDomain)}`);
                    }}
                  />
                </div>
                {account && (
                  <div>
                    <img src="/account.png" alt="Account" style={accountIconStyle} onClick={() => { setShowAccount(true); setIsContentVisible(true); }} />
                  </div>
                )}
              </div>
            </Layout.Section>
            <Layout.Section>
              <Card>
                <div style={formContainerStyle}>
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <Text as="h3" variant="headingMd" fontWeight="bold" tone="critical">
                      Please create an account first
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued" style={{ marginTop: "1rem" }}>
                      No account found for shop: {shopDomain || 'unknown'}. Create an account to proceed.
                    </Text>
                  </div>
                  {isContentVisible && showAccount ? (
                    <div style={formContainerStyle}>
                      <Text as="p" variant="bodyMd" tone="subdued" style={{ marginBottom: "0.5rem" }}>
                        Add Account Details
                      </Text>
                      <Form method="post">
                        <input type="hidden" name="actionType" value="create" />
                        <input type="hidden" name="shop" value={shopDomain} />
                        <div style={inputWrapperStyle}>
                          <label htmlFor="username" style={labelStyle}>Username</label>
                          <div style={inputContainerStyle}>
                            <UserOutlined style={detailIconStyle} />
                            <TextField
                              id="username"
                              name="username"
                              placeholder="Enter username"
                              required
                              value={accountDetails.username}
                              onChange={handleUsernameChange}
                              error={usernameError}
                              inputMode="text"
                              style={inputStyle}
                            />
                          </div>
                          {usernameError && (
                            <Text as="p" style={errorStyle}>
                              {usernameError}
                            </Text>
                          )}
                        </div>
                        <div style={inputWrapperStyle}>
                          <label htmlFor="email" style={labelStyle}>Email</label>
                          <div style={inputContainerStyle}>
                            <MailOutlined style={detailIconStyle} />
                            <TextField
                              id="email"
                              type="email"
                              name="email"
                              placeholder="Enter email"
                              required
                              value={accountDetails.email}
                              onChange={handleEmailChange}
                              error={emailError}
                              inputMode="email"
                              style={inputStyle}
                            />
                          </div>
                          {emailError && (
                            <Text as="p" style={errorStyle}>
                              {emailError}
                            </Text>
                          )}
                        </div>
                        {actionData?.error && (
                          <Text as="p" style={{ ...errorStyle, marginBottom: "1rem" }}>
                            {actionData.error}
                          </Text>
                        )}
                        <div style={buttonContainerStyle}>
                          <Button
                            variant="primary"
                            submit
                            disabled={!accountDetails.username || !accountDetails.email || usernameError || emailError || isLoading}
                            loading={isLoading}
                            style={buttonStyle}
                          >
                            Save Account
                          </Button>
                        </div>
                      </Form>
                    </div>
                  ) : (
                    <div style={{ marginTop: "1.5rem" }}>
                      <center>
                        <Button
                          variant="primary"
                          size="large"
                          onClick={() => {
                            setIsContentVisible(true);
                            setShowAccount(true);
                          }}
                          style={buttonStyle}
                        >
                          Create Account
                        </Button>
                      </center>
                    </div>
                  )}
                </div>
              </Card>
            </Layout.Section>
          </Layout>
          {toastMarkup}
          {isLoading && <FullScreenLoader />}
        </Page>
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', minHeight: '100vh' }}>
          <Page title="Products and Reviews">
            <Layout>
              <Layout.Section>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <HomeOutlined
                      style={homeIconStyle}
                      onClick={() => {
                        setShowAccount(false);
                        navigate(`/app?shop=${encodeURIComponent(shopDomain)}`);
                      }}
                    />
                    <SettingOutlined
                      style={settingIconStyle}
                      onClick={() => {
                        setShowAccount(false);
                        navigate(`/app/star-rating-settings?shop=${encodeURIComponent(shopDomain)}`);
                      }}
                    />
                    <ProductOutlined
                      style={productIconStyle}
                      onClick={() => {
                        setShowAccount(false);
                        navigate(`/app/dis_rating_admin?shop=${encodeURIComponent(shopDomain)}`);
                      }}
                    />
                  </div>
                  {account && (
                    <img
                      src="/account.png"
                      alt="Account"
                      style={accountIconStyle}
                      onClick={() => setShowAccount(!showAccount)}
                    />
                  )}
                </div>
              </Layout.Section>

              {showAccount ? (
                <Layout.Section>
                  <Card>
                    <Text as="h3" variant="headingMd" style={{ padding: "1rem", color: "#2d3748" }}>
                      Account
                    </Text>
                    <div style={{ padding: "1rem" }}>
                      {createdAccount && !isEditing ? (
                        <div style={formContainerStyle}>
                          <Text as="p" variant="bodyMd" tone="subdued" style={{ marginBottom: "0.5rem" }}>
                            Account Details
                          </Text>
                          <div style={inputWrapperStyle}>
                            <label htmlFor="username" style={labelStyle}>Username</label>
                            <div style={detailItemStyle}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                                <img src="/user.png" alt="User" style={detailIconStyle} />
                                {editingField === "username" ? (
                                  <TextField
                                    id="username"
                                    name="username"
                                    value={accountDetails.username}
                                    onChange={handleUsernameChange}
                                    error={usernameError}
                                    inputMode="text"
                                    autoFocus
                                    style={inputStyle}
                                  />
                                ) : (
                                  <Text as="span" style={detailStyle}>
                                    {createdAccount.username || "N/A"}
                                  </Text>
                                )}
                              </div>
                              {editingField === "username" ? (
                                <InlineStack gap="200">
                                  <Button
                                    variant="primary"
                                    onClick={() => handleSaveField("username")}
                                    disabled={isLoading || usernameError || !accountDetails.username}
                                    loading={isLoading}
                                    size="slim"
                                    style={{ ...buttonStyle, height: "32px", padding: "0 1rem" }}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    onClick={handleCancelEdit}
                                    disabled={isLoading}
                                    size="slim"
                                    style={{ ...buttonStyle, backgroundColor: "#666", height: "32px", padding: "0 1rem" }}
                                  >
                                    Cancel
                                  </Button>
                                </InlineStack>
                              ) : (
                                <EditOutlined
                                  style={editIconStyle}
                                  onClick={() => handleEditClick("username")}
                                />
                              )}
                            </div>
                            {usernameError && editingField === "username" && (
                              <Text as="p" style={errorStyle}>
                                {usernameError}
                              </Text>
                            )}
                          </div>
                          <div style={inputWrapperStyle}>
                            <label htmlFor="email" style={labelStyle}>Email</label>
                            <div style={detailItemStyle}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                                <img src="/mail.png" alt="Email" style={detailIconStyle} />
                                {editingField === "email" ? (
                                  <TextField
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={accountDetails.email}
                                    onChange={handleEmailChange}
                                    error={emailError}
                                    inputMode="email"
                                    autoFocus
                                    style={inputStyle}
                                  />
                                ) : (
                                  <Text as="span" style={detailStyle}>
                                    {createdAccount.email || "N/A"}
                                  </Text>
                                )}
                              </div>
                              {editingField === "email" ? (
                                <InlineStack gap="200">
                                  <Button
                                    variant="primary"
                                    onClick={() => handleSaveField("email")}
                                    disabled={isLoading || emailError || !accountDetails.email}
                                    loading={isLoading}
                                    size="slim"
                                    style={{ ...buttonStyle, height: "32px", padding: "0 1rem" }}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    onClick={handleCancelEdit}
                                    disabled={isLoading}
                                    size="slim"
                                    style={{ ...buttonStyle, backgroundColor: "#666", height: "32px", padding: "0 1rem" }}
                                  >
                                    Cancel
                                  </Button>
                                </InlineStack>
                              ) : (
                                <EditOutlined
                                  style={editIconStyle}
                                  onClick={() => handleEditClick("email")}
                                />
                              )}
                            </div>
                            {emailError && editingField === "email" && (
                              <Text as="p" style={errorStyle}>
                                {emailError}
                              </Text>
                            )}
                          </div>
                          <div style={inputWrapperStyle}>
                            <label htmlFor="serialkey" style={labelStyle}>Serial Key</label>
                            <div style={nonEditableDetailItemStyle}>
                              <img src="/lock.png" alt="Serial Key" style={detailIconStyle} />
                              <Text as="span" style={detailStyle}>
                                {createdAccount.serialkey || "N/A"}
                              </Text>
                            </div>
                          </div>
                          <div style={inputWrapperStyle}>
                            <label htmlFor="shop" style={labelStyle}>Shop</label>
                            <div style={nonEditableDetailItemStyle}>
                              <img src="/shopify.png" alt="Shop" style={shopImageStyle} />
                              <Text as="span" style={detailStyle}>
                                {createdAccount.shop || 'N/A'}
                              </Text>
                            </div>
                          </div>
                          <div style={buttonContainerStyle}>
                            <Button
                              onClick={handleEditAllClick}
                              variant="primary"
                              disabled={isLoading || editingField}
                              style={buttonStyle}
                            >
                              Edit All
                            </Button>
                            <Button
                              onClick={handleDeleteClick}
                              variant="secondary"
                              tone="critical"
                              disabled={isLoading || editingField}
                              style={{ ...buttonStyle, backgroundColor: "#ff4444" }}
                            >
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div style={formContainerStyle}>
                          <Text as="p" variant="bodyMd" tone="subdued" style={{ marginBottom: "0.5rem" }}>
                            {isEditing ? "Edit Account Details" : "Add Account Details"}
                          </Text>
                          <Form method="post">
                            <input type="hidden" name="actionType" value={isEditing ? "edit" : "create"} />
                            <input type="hidden" name="shop" value={shopDomain} />
                            {isEditing && (
                              <input type="hidden" name="serialkey" value={createdAccount?.serialkey} />
                            )}
                            <div style={inputWrapperStyle}>
                              <label htmlFor="username" style={labelStyle}>Username</label>
                              <div style={inputContainerStyle}>
                                <UserOutlined style={detailIconStyle} />
                                <TextField
                                  id="username"
                                  name="username"
                                  placeholder="Enter username"
                                  required
                                  value={accountDetails.username}
                                  onChange={handleUsernameChange}
                                  error={usernameError}
                                  inputMode="text"
                                  style={inputStyle}
                                />
                              </div>
                              {usernameError && (
                                <Text as="p" style={errorStyle}>
                                  {usernameError}
                                </Text>
                              )}
                            </div>
                            <div style={inputWrapperStyle}>
                              <label htmlFor="email" style={labelStyle}>Email</label>
                              <div style={inputContainerStyle}>
                                <MailOutlined style={detailIconStyle} />
                                <TextField
                                  id="email"
                                  type="email"
                                  name="email"
                                  placeholder="Enter email"
                                  required
                                  value={accountDetails.email}
                                  onChange={handleEmailChange}
                                  error={emailError} // Removed the stray double quote
                                  inputMode="email"
                                  style={inputStyle}
                                />
                              </div>
                              {emailError && (
                                <Text as="p" style={errorStyle}>
                                  {emailError}
                                </Text>
                              )}
                            </div>
                            {actionData?.error && (
                              <Text as="p" style={{ ...errorStyle, marginBottom: "1rem" }}>
                                {actionData.error}
                              </Text>
                            )}
                            <div style={buttonContainerStyle}>
                              <Button
                                variant="primary"
                                submit
                                disabled={!accountDetails.username || !accountDetails.email || usernameError || emailError || isLoading}
                                loading={isLoading}
                                style={buttonStyle}
                              >
                                {isEditing ? "Update Account" : "Save Account"}
                              </Button>
                              {isEditing && (
                                <Button
                                  onClick={handleCancelEdit}
                                  disabled={isLoading}
                                  style={{ ...buttonStyle, backgroundColor: "#666" }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </Form>
                        </div>
                      )}
                    </div>
                  </Card>
                </Layout.Section>
              ) : (
                <Layout.Section>
                  {settings?.status?.toLowerCase() === 'disabled' && (
                    <Card
                      style={{
                        background: "white",
                        margin: "12px",
                        borderRadius: "5",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <div style={{ padding: '20px', textAlign: 'center' }}>
                        <Text as="h3" variant="headingMd" fontWeight="bold" tone="critical">
                          App is Disabled
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued" style={{ marginTop: '1rem' }}>
                          The app is disabled for this shop. You can still view existing data below.
                        </Text>
                      </div>
                    </Card>
                  )}
                  <Card>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #dfe3e8' }}>
                      <InlineStack gap="400" blockAlign="end" wrap={false}>
                        <div style={{ flexGrow: 1 }}>
                          <TextField
                            label="Filter products"
                            labelHidden
                            value={productSearchTerm}
                            onChange={setProductSearchTerm}
                            placeholder="Search by ID, Title, or Handle"
                            autoComplete="off"
                            clearButton
                            onClearButtonClick={() => setProductSearchTerm('')}
                          />
                        </div>
                        <div style={{ minWidth: '200px' }}>
                          <Select
                            label="Sort by"
                            labelHidden
                            options={productSortOptions}
                            onChange={setProductSortOption}
                            value={productSortOption}
                          />
                        </div>
                        <div>
                          <Text as="p" tone="subdued">{`${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`}</Text>
                        </div>
                      </InlineStack>
                    </div>
                    {filteredProducts.length === 0 && productSearchTerm ? (
                      <div style={{padding: '1rem', textAlign: 'center'}}>
                        <Text as="p">No products found matching your search.</Text>
                      </div>
                    ) : filteredProducts.length === 0 && !productSearchTerm ? (
                       <div style={{padding: '1rem', textAlign: 'center'}}>
                        <Text as="p">No products available.</Text>
                      </div>
                    ) : (
                      <DataTable
                        columnContentTypes={['text', 'text', 'text', 'text']}
                        headings={['Product ID', 'Product Name', 'Handle', 'Actions']}
                        rows={productRows}
                      />
                    )}
                  </Card>
                </Layout.Section>
              )}
            </Layout>
            
    

            {showReviewsModal && (
              <Modal
                fullScreen // Changed large to fullScreen for maximum width
                open={showReviewsModal}
                onClose={() => {
                  setShowReviewsModal(false);
                  setSelectedProductId(null);
                  setSelectedProductTitle('');
                  setRatings([]);
                  setFilteredRatings([]);
                  setError(null);
                }}
                primaryAction={{
                  content: 'Close',
                  onAction: () => {
                    setShowReviewsModal(false);
                    setSelectedProductId(null);
                    setSelectedProductTitle('');
                    setRatings([]);
                    setFilteredRatings([]);
                    setError(null);
                  },
                }}
              >
                <Modal.Section>
                  <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start' }}>
                    <Button
                      onClick={() => {
                        setInsertFields({
                          ...insertFields,
                          productId: selectedProductId,
                          productTitle: selectedProductTitle,
                        });
                        setShowInsertModal(true);
                      }}
                      variant="primary"
                      tone="monochrome"
                    >
                      Insert New Rating
                    </Button>
                  </div>
                  <div style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #dfe3e8', borderRadius: '4px' }}>
                    <InlineStack gap="300" blockAlign="end" wrap={true}>
                      <div style={{minWidth: '150px'}}>
                        <TextField label="ID" value={idFilter} onChange={setIdFilter} placeholder="Review ID" autoComplete="off" clearButton onClearButtonClick={() => setIdFilter('')} labelHidden/>
                      </div>
                      <div style={{minWidth: '150px'}}>
                        <TextField label="Customer" value={customerNameFilter} onChange={setCustomerNameFilter} placeholder="Customer Name" autoComplete="off" clearButton onClearButtonClick={() => setCustomerNameFilter('')} labelHidden/>
                      </div>
                      <div style={{minWidth: '130px'}}>
                        <Select
                          label="Rating"
                          labelHidden
                          options={[{ label: 'Any Rating', value: '' }, { label: '5 ★', value: '5' }, { label: '4 ★', value: '4' }, { label: '3 ★', value: '3' }, { label: '2 ★', value: '2' }, { label: '1 ★', value: '1' }]}
                          onChange={setStarFilter}
                          value={starFilter}
                        />
                      </div>
                      <div style={{minWidth: '150px'}}>
                        <Select
                          label="Status"
                          labelHidden
                          options={[{ label: 'Any Status', value: '' }, { label: 'Approved', value: 'approved' }, { label: 'Pending', value: 'pending' }, { label: 'Not Approved', value: 'not approved' }]}
                          onChange={setStatusFilter}
                          value={statusFilter}
                        />
                      </div>
                      <div style={{minWidth: '150px'}}>
                        <Select
                          label="Author"
                          labelHidden
                          options={[{ label: 'Any Author', value: '' }, { label: 'Administrator', value: 'administrator' }, { label: 'Customer', value: 'customer' }]}
                          onChange={setAuthorFilter}
                          value={authorFilter}
                        />
                      </div>
                      <div style={{minWidth: '170px'}}>
                        <TextField label="Date From" labelHidden value={createdAtFromFilter} onChange={setCreatedAtFromFilter} onBlur={handleDateBlur} type="date" autoComplete="off" placeholder="Date From"/>
                      </div>
                      <div style={{minWidth: '170px'}}>
                        <TextField label="Date To" labelHidden value={createdAtToFilter} onChange={setCreatedAtToFilter} onBlur={handleDateBlur} type="date" autoComplete="off" placeholder="Date To"/>
                      </div>
                       <div style={{ minWidth: '180px' }}>
                         <Select
                            label="Sort Reviews"
                            labelHidden
                            options={reviewSortOptions}
                            onChange={setReviewSortOption}
                            value={reviewSortOption}
                          />
                       </div>
                      <Button onClick={() => {
                        setIdFilter('');
                        setCustomerNameFilter('');
                        setStarFilter('');
                        setStatusFilter('');
                        setAuthorFilter('');
                        setCreatedAtFromFilter('');
                        setCreatedAtToFilter('');
                        setReviewSortOption('createdAt_desc'); // Reset sort
                      }}>Clear All</Button>
                    </InlineStack>
                     <div style={{marginTop: '0.5rem', textAlign: 'right'}}>
                        <Text as="p" tone="subdued">{`${filteredRatings.length} review${filteredRatings.length === 1 ? '' : 's'} found`}</Text>
                    </div>
                  </div>
                  {loading ? (
                    <Text>Loading reviews...</Text>
                  ) : error ? (
                    <Text color="critical">{error}</Text>
                  ) : filteredRatings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <Text as="p" variant="bodyMd" fontWeight="medium">
                        No reviews found for this product matching your filters.
                      </Text>
                    </div>
                  ) : (
                    <div style={tableStyles.tableWrapper}>
                      <DataTable
                        columnContentTypes={[
                          // 'text', // ID - commented out in rows mapping
                          'text', // Customer Name
                          'text', // Product
                          'text', // Ratings
                          'text', // Review Title
                          'text', // Review
                          'text', // Status
                          'text', // Created At
                          'text', // Media
                          'text', // Actions
                        ]}
                        headings={[
                          // 'ID',
                          'Customer Name',
                          'Product',
                          'Ratings',
                          'Review Title',
                          'Review',
                          'Status',
                          'Created At',
                          'Media',
                          'Actions',
                        ]}
                        rows={rows}
                        verticalAlign="middle"
                        columnStyles={{
                          5: tableStyles.reviewCell, // Review content
                          4: tableStyles.reviewTitleCell, // Review title
                        }}
                        style={tableStyles.table}
                      />
                    </div>
                  )}
                </Modal.Section>
              </Modal>
            )}

            {showInsertModal && (
              <Modal
                open={showInsertModal}
                onClose={() => setShowInsertModal(false)}
                title="Insert New Rating"
                primaryAction={{
                  content: inserting ? 'Inserting...' : 'Insert Rating',
                  onAction: handleInsertSubmit,
                  disabled: inserting,
                  variant: 'primary',
                  tone: 'monochrome',
                }}
                secondaryActions={[
                  {
                    content: 'Cancel',
                    onAction: () => {
                      setShowInsertModal(false);
                      setInsertFields({
                        customerName: '',
                        reviewTitle: '',
                        review: '',
                        star: '',
                        status: 'approved',
                        productId: '',
                        productTitle: '',
                        media: [],
                      });
                    },
                  },
                ]}
              >
                <Modal.Section>
                  <FormLayout>
                    <TextField
                      label="Product ID & Title"
                      value={`${insertFields.productId} - ${insertFields.productTitle}`}
                      disabled
                    />
                    <FormLayout.Group>
                      <div>
                        <Text as="p" variant="bodyMd" fontWeight="medium">
                          Star Rating <Text as="span" tone="critical">*</Text>
                        </Text>
                        <StarRating
                          value={insertFields.star}
                          onChange={(val) =>
                            setInsertFields({ ...insertFields, star: val })
                          }
                        />
                      </div>
                    </FormLayout.Group>
                    <Select
                      label="Status"
                      options={['pending', 'approved', 'not approved'].map((s) => ({
                        label: s.charAt(0).toUpperCase() + s.slice(1),
                        value: s,
                      }))}
                      value={insertFields.status}
                      onChange={(val) =>
                        setInsertFields({ ...insertFields, status: val })
                      }
                      requiredIndicator
                    />
                    <TextField
                      label="Customer Name"
                      value={insertFields.customerName}
                      onChange={(val) =>
                        setInsertFields({ ...insertFields, customerName: val })
                      }
                      requiredIndicator
                    />
                    <TextField
                      label="Review Title"
                      value={insertFields.reviewTitle}
                      onChange={(val) =>
                        setInsertFields({ ...insertFields, reviewTitle: val })
                      }
                      requiredIndicator
                    />
                    <TextField
                      label="Review"
                      value={insertFields.review}
                      onChange={(val) =>
                        setInsertFields({ ...insertFields, review: val })
                      }
                      multiline={4}
                      requiredIndicator
                    />
                    <div>
                      <Text as="p" variant="bodyMd" fontWeight="medium">
                        Upload Media (Images or Videos)
                      </Text>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => handleFileChange(e.target.files)}
                        style={{
                          padding: '8px',
                          border: '1px solid #dfe3e8',
                          borderRadius: '6px',
                          width: '100%',
                          height: '40px',
                        }}
                      />
                      {insertFields.media.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <Text as="p" variant="bodySm">
                            Selected files: {insertFields.media.map(file => file.name).join(', ')}
                          </Text>
                        </div>
                      )}
                    </div>
                  </FormLayout>
                </Modal.Section>
              </Modal>
            )}

            {editingRating && (
              <Modal
                open={editingRating}
                onClose={() => setEditingRating(null)}
                title="Edit Rating"
                primaryAction={{
                  content: updating ? 'Updating...' : 'Update Rating',
                  onAction: handleUpdateSubmit,
                  disabled: updating,
                  variant: 'primary',
                  tone: 'monochrome',
                }}
                secondaryActions={[
                  {
                    content: 'Cancel',
                    onAction: () => setEditingRating(null),
                    variant: 'primary',
                    tone: 'monochrome',
                  },
                ]}
              >
                <Modal.Section>
                  <FormLayout>
                    <center>
                      <a
                        href={`https://${encodeURIComponent(getShopFromURL())}/admin/products/${editingRating.productId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Go to product page"
                        style={{
                          padding: '8px 12px',
                          background: '#fff',
                          color: '#5c6ac4',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'inline-block',
                          textDecoration: 'underline',
                        }}
                      >
                        <Text as="span">
                          {(() => {
                            const product = products.find((p) => p.id === editingRating.productId.toString());
                            return product
                              ? `${editingRating.productId} - ${product.title}`
                              : editingRating.productId.toString();
                          })()}
                        </Text>
                      </a>
                    </center>
                    <FormLayout.Group>
                      <div>
                        <Text as="p" variant="bodyMd" fontWeight="medium">
                          Star Rating <Text as="span" tone="critical">*</Text>
                        </Text>
                        <StarRating
                          value={editFields.star}
                          onChange={(val) => setEditFields({ ...editFields, star: val })}
                        />
                      </div>
                    </FormLayout.Group>
                    <Select
                      label="Status"
                      options={['pending', 'approved', 'not approved'].map((s) => ({
                        label: s.charAt(0).toUpperCase() + s.slice(1),
                        value: s,
                      }))}
                      value={editFields.status}
                      onChange={(val) =>
                        setEditFields({ ...editFields, status: val })
                      }
                      requiredIndicator
                    />
                    <TextField
                      label="Customer Name"
                      value={editFields.customerName}
                      onChange={(val) =>
                        setEditFields({ ...editFields, customerName: val })
                      }
                      requiredIndicator
                    />
                    <TextField
                      label="Review Title"
                      value={editFields.reviewTitle}
                      onChange={(val) =>
                        setEditFields({ ...editFields, reviewTitle: val })
                      }
                      requiredIndicator
                    />
                    <TextField
                      label="Review"
                      value={editFields.review}
                      onChange={(val) =>
                        setEditFields({ ...editFields, review: val })
                      }
                      multiline={4}
                      requiredIndicator
                    />
                    <div>
                      <Text as="p" variant="bodyMd" fontWeight="medium">
                        Existing Media
                      </Text>
                      {editFields.existingMedia?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          {editFields.existingMedia.map((path, index) => {
                            const isImage = path.match(/\.(jpg|jpeg|png|gif)$/i);
                            const isVideo = path.match(/\.(mp4|webm|ogg)$/i);
                            return (
                              <div key={index} style={{ maxWidth: '100px', position: 'relative' }}>
                                {isImage ? (
                                  <img
                                    src={path}
                                    alt={`Media ${index + 1}`}
                                    style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
                                  />
                                ) : isVideo ? (
                                  <video
                                    src={path}
                                    controls
                                    style={{ maxWidth: '100px', maxHeight: '100px' }}
                                  />
                                ) : (
                                  <Text as="span">Unsupported file</Text>
                                )}
                                <Button
                                  size="small"
                                  tone="critical"
                                  onClick={() =>
                                    setEditFields(prev => ({
                                      ...prev,
                                      existingMedia: prev.existingMedia.filter((_, i) => i !== index),
                                    }))
                                  }
                                  style={{ position: 'absolute', top: '0', right: '0', padding: '4px' }}
                                >
                                  X
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <Text as="p" variant="bodySm">No existing media</Text>
                      )}
                    </div>
                    <div>
                      <Text as="p" variant="bodyMd" fontWeight="medium">
                        Upload New Media (Images or Videos)
                      </Text>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => handleFileChange(e.target.files, true)}
                        style={{
                          padding: '8px',
                          border: '1px solid #dfe3e8',
                          borderRadius: '6px',
                          width: '100%',
                          height: '40px',
                        }}
                      />
                      {editFields.media.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <Text as="p" variant="bodySm">
                            Selected new files: {editFields.media.map(file => file.name).join(', ')}
                          </Text>
                        </div>
                      )}
                    </div>
                  </FormLayout>
                </Modal.Section>
              </Modal>
            )}

            {showDeleteModal && (
              <Modal
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirm Delete"
                primaryAction={{
                  content: 'OK',
                  onAction: handleConfirmDelete,
                  disabled: deleting,
                  destructive: true,
                }}
                secondaryActions={[
                  {
                    content: 'Cancel',
                    onAction: () => setShowDeleteModal(false),
                  },
                ]}
              >
                <Modal.Section>
                  <Text as="p">Are you sure you want to delete this rating?</Text>
                </Modal.Section>
              </Modal>
            )}

            {showDeleteAccountModal && (
              <Modal
                open={showDeleteAccountModal}
                onClose={() => setShowDeleteAccountModal(false)}
                title="Confirm Account Deletion"
                primaryAction={{
                  content: "Delete",
                  destructive: true,
                  disabled: isLoading,
                  onAction: handleDeleteConfirm,
                }}
                secondaryActions={[
                  {
                    content: "Cancel",
                    disabled: isLoading,
                    onAction: () => setShowDeleteAccountModal(false),
                  },
                ]}
              >
                <Modal.Section>
                  <Text as="p">
                    Are you sure you want to delete this account? This action will also remove all associated ratings and settings. This cannot be undone.
                  </Text>
                </Modal.Section>
              </Modal>
            )}

            {/* Old showMediaViewModal removed, will be replaced by showAllMediaModal logic */}

            {showAllMediaModal && currentReviewMediaPaths.length > 0 && (
              <Modal
                large // Make the modal larger
                open={showAllMediaModal}
                onClose={() => {
                  setShowAllMediaModal(false);
                  setCurrentReviewMediaPaths([]);
                }}
                title="View All Media"
                secondaryActions={[ // Only a close button is needed as primary actions are per item
                  {
                    content: 'Close',
                    onAction: () => {
                      setShowAllMediaModal(false);
                      setCurrentReviewMediaPaths([]);
                    },
                  },
                ]}
              >
                <Modal.Section>
                  <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '1rem' /* for scrollbar */ }}>
                    <Layout>
                      {currentReviewMediaPaths.map((path, index) => {
                        const isImage = path.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        const isVideo = path.match(/\.(mp4|webm|ogg)$/i);
                        const mediaType = isImage ? 'image' : isVideo ? 'video' : 'unknown';
                        const fileName = path.split('/').pop();

                        return (
                          <Layout.Section key={index}>
                            <Card sectioned>
                              <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                {mediaType === 'image' && (
                                  <img
                                    src={path}
                                    alt={`Media ${index + 1}`}
                                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', marginBottom: '0.5rem' }}
                                  />
                                )}
                                {mediaType === 'video' && (
                                  <video
                                    src={path}
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '300px', marginBottom: '0.5rem' }}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                )}
                                {mediaType === 'unknown' && (
                                  <div style={{ padding: '1rem', border: '1px dashed #ccc', marginBottom: '0.5rem' }}>
                                    <Text as="p">Cannot preview this file type: {fileName}</Text>
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <Button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = path;
                                    link.download = fileName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                >
                                  Download {fileName}
                                </Button>
                              </div>
                            </Card>
                          </Layout.Section>
                        );
                      })}
                    </Layout>
                  </div>
                </Modal.Section>
              </Modal>
            )}

           </Page>
          {toastMarkup}
          {isLoading && <FullScreenLoader />}
        </div>
      )}
    </Frame>
  );
}