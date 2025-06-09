import { json } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, useLocation, useSubmit } from "@remix-run/react";
import { Frame, Page, Toast, Card, Layout, Button, Text, Spinner, TextField, Modal } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import React, { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import {
  HomeOutlined,
  ProductOutlined,
  SettingOutlined,
  UserOutlined,
  MailOutlined,
  KeyOutlined,
  EditOutlined,
  DeleteOutlined,
  NumberOutlined,
  FileTextOutlined,
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
  gap: "1rem",
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
  width: "34px",
  height: "34px",
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

const sectionIconStyle = {
  width: "30px",
  height: "30px",
  color: "#073E74",
  padding: "4px",
  borderRadius: "4px",
};

const dropdownToggleStyle = {
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "#F0F2F5",
  border: "1px solid #d9d9d9",
  borderRadius: "6px",
  padding: "4px",
  height: "44px",
  width: "100%",
  boxSizing: "border-box",
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#333",
  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
};

const dropdownMenuStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  backgroundColor: "#fff",
  border: "1px solid #d9d9d9",
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  zIndex: 1000,
  marginTop: "0.25rem",
  width: "100%",
  padding: "0.25rem 0",
};

const dropdownItemStyle = {
  padding: "0.5rem 0.75rem",
  cursor: "pointer",
  fontSize: "14px",
  color: "#333",
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  backgroundColor: "transparent",
  borderRadius: "4px",
  height: "40px",
  boxSizing: "border-box",
  margin: "0 0.25rem",
  transition: "background-color 0.3s ease",
};

const dropdownItemSelectedStyle = {
  backgroundColor: "#D4EFCC",
  color: "#333",
};

const dropdownItemHoverStyle = {
  backgroundColor: "#f5f5f5",
};

const statusIconStyle = {
  width: "34px",
  height: "34px",
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

const TOAST_DURATION = 5000; // 5 seconds

export async function loader({ request }) {
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

    const account = await prisma.account.findFirst({
      where: { shop: shopDomain },
    });

    if (!account) {
      return json({ shopDomain, serialKey: null, settings: null, error: "No account found for this shop", account: null }, { status: 404 });
    }

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

    return json({
      shopDomain,
      serialKey: account.serialkey,
      settings: {
        status: statusSetting?.value || "enabled",
        displayStyle: displayStyleSetting?.value || "grid",
        reviewLimit: reviewLimitSetting?.value || "5",
        reviewDisplayHeading: reviewDisplayHeadingSetting?.value || "Customer Reviews",
        reviewFormHeading: reviewFormHeadingSetting?.value || "Submit Your Reviews",
      },
      account: {
        username: account.username,
        email: account.email,
        serialkey: account.serialkey,
        shop: account.shop,
      },
      error: null,
    });
  } catch (error) {
    return json({
      shopDomain: null,
      serialKey: null,
      settings: null,
      account: null,
      error: error.message || "Failed to load data",
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

    if (actionType === "settings") {
      const serialKey = formData.get("serialKey");
      const status = formData.get("status");
      const displayStyle = formData.get("displayStyle");
      const reviewLimit = formData.get("reviewLimit");
      const reviewDisplayHeading = formData.get("reviewDisplayHeading");
      const reviewFormHeading = formData.get("reviewFormHeading");

      if (!serialKey || !status || !displayStyle || !reviewLimit || !reviewDisplayHeading || !reviewFormHeading) {
        return json({ error: "Missing one or more required fields" }, { status: 400 });
      }

      const account = await prisma.account.findFirst({
        where: { shop: shopDomain },
      });

      if (!account) {
        return json({ error: "No account found for this shop", shopDomain }, { status: 404 });
      }

      if (account.serialkey !== serialKey) {
        return json(
          { error: "Invalid serial key provided. Please enter the correct key for this shop.", shopDomain },
          { status: 400 }
        );
      }

      await prisma.settings.upsert({
        where: { key: serialKey },
        update: { value: status },
        create: { key: serialKey, value: status },
      });

      await prisma.settings.upsert({
        where: { key: `${serialKey}_displayStyle` },
        update: { value: displayStyle },
        create: { key: `${serialKey}_displayStyle`, value: displayStyle },
      });

      await prisma.settings.upsert({
        where: { key: `${serialKey}_reviewLimit` },
        update: { value: reviewLimit },
        create: { key: `${serialKey}_reviewLimit`, value: reviewLimit },
      });

      await prisma.settings.upsert({
        where: { key: `${serialKey}_reviewDisplayHeading` },
        update: { value: reviewDisplayHeading },
        create: { key: `${serialKey}_reviewDisplayHeading`, value: reviewDisplayHeading },
      });

      await prisma.settings.upsert({
        where: { key: `${serialKey}_reviewFormHeading` },
        update: { value: reviewFormHeading },
        create: { key: `${serialKey}_reviewFormHeading`, value: reviewFormHeading },
      });

      return json({
        success: true,
        message: "Settings updated successfully!",
        submittedValues: {
          serialKey,
          status,
          displayStyle,
          reviewLimit,
          reviewDisplayHeading,
          reviewFormHeading,
        },
      });
    } else if (actionType === "delete") {
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

export default function StarRatingSettings() {
  const { shopDomain, serialKey, settings, error: loaderError, account } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();
  const location = useLocation();
  const [formState, setFormState] = useState({
    serialKey: serialKey || "",
    status: settings?.status || "enabled",
    displayStyle: settings?.displayStyle || "grid",
    reviewLimit: settings?.reviewLimit || "5",
    reviewDisplayHeading: settings?.reviewDisplayHeading || "Customer Reviews",
    reviewFormHeading: settings?.reviewFormHeading || "Submit Your Review",
  });
  const [toast, setToast] = useState({ active: false, content: "", error: false });
  const [showAccount, setShowAccount] = useState(false);
  const [accountDetails, setAccountDetails] = useState({ username: "", email: "" });
  const [createdAccount, setCreatedAccount] = useState(account);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(!!account);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isDisplayStyleDropdownOpen, setIsDisplayStyleDropdownOpen] = useState(false);
  const isLoading = navigation.state === "loading" || navigation.state === "submitting";

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
    submit(formData, { method: "post" });
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!shopDomain) {
      setToast({ active: true, content: "Shop domain not detected. Please try again.", error: true });
      return;
    }
    const formData = new FormData();
    formData.append("actionType", "delete");
    formData.append("serialkey", createdAccount?.serialkey);
    formData.append("shop", shopDomain);
    submit(formData, { method: "post" });
    setShowDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleDropdownKeyDown = (event, setDropdownOpen) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setDropdownOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    if (serialKey && settings) {
      setFormState({
        serialKey,
        status: settings.status,
        displayStyle: settings.displayStyle,
        reviewLimit: settings.reviewLimit,
        reviewDisplayHeading: settings.reviewDisplayHeading,
        reviewFormHeading: settings.reviewFormHeading,
      });
    }
  }, [serialKey, settings]);

  useEffect(() => {
    let timeoutId;
    if (actionData?.success) {
      setToast({
        active: true,
        content: actionData.message || "Operation completed successfully!",
        error: false,
      });
      timeoutId = setTimeout(() => {
        setToast({ active: false, content: "", error: false });
      }, TOAST_DURATION);

      if (actionData.message === "Settings updated successfully!") {
        setFormState({
          serialKey: actionData.submittedValues.serialKey,
          status: actionData.submittedValues.status,
          displayStyle: actionData.submittedValues.displayStyle,
          reviewLimit: actionData.submittedValues.reviewLimit,
          reviewDisplayHeading: actionData.submittedValues.reviewDisplayHeading,
          reviewFormHeading: actionData.submittedValues.reviewFormHeading,
        });
      } else if (actionData.message === "Account updated successfully" || actionData.message === "Account created successfully") {
        setCreatedAccount(actionData.account);
        setAccountDetails({ username: "", email: "" });
        setUsernameError("");
        setEmailError("");
        setIsEditing(false);
        setEditingField(null);
        setIsContentVisible(true);
      } else if (actionData.message === "Account deleted successfully") {
        setCreatedAccount(null);
        setIsContentVisible(false);
        setShowAccount(false);
      }
    } else if (actionData?.error) {
      setToast({ active: true, content: actionData.error, error: true });
      timeoutId = setTimeout(() => {
        setToast({ active: false, content: "", error: false });
      }, TOAST_DURATION);
    } else if (loaderError) {
      setToast({ active: true, content: loaderError, error: true });
      timeoutId = setTimeout(() => {
        setToast({ active: false, content: "", error: false });
      }, TOAST_DURATION);
    }

    return () => clearTimeout(timeoutId);
  }, [actionData, loaderError]);

  const handleInputChange = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (key === "status") setIsStatusDropdownOpen(false);
    if (key === "displayStyle") setIsDisplayStyleDropdownOpen(false);
  };

  if (loaderError === "No account found for this shop" || !serialKey || !createdAccount) {
    return (
      <Frame>
        <Page title="Star Rating Settings">
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
                    src="/account.svg"
                    alt="Account"
                    style={accountIconStyle}
                    onClick={() => {
                      setShowAccount(true);
                      setIsContentVisible(true);
                    }}
                  />
                )}
              </div>
            </Layout.Section>
            <Layout.Section>
              <Card style={formContainerStyle}>
                <div style={{ padding: "2rem", textAlign: "center" }}>
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
                          <img src="/user.svg" alt="User" style={detailIconStyle} />
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
                          <img src="/mail.svg" alt="Email" style={detailIconStyle} />
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
              </Card>
            </Layout.Section>
          </Layout>
          {toast.active && (
            <Toast
              content={toast.content}
              error={toast.error}
              onDismiss={() => setToast({ active: false, content: "", error: false })}
              duration={TOAST_DURATION}
            />
          )}
          {isLoading && <FullScreenLoader />}
        </Page>
      </Frame>
    );
  }

  return (
    <Frame>
      <Page title="Star Rating Settings">
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
                  src="/account.svg"
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
                            <img src="/user.svg" alt="User" style={detailIconStyle} />
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
                            <>
                              <Button
                                variant="primary"
                                onClick={() => handleSaveField("username")}
                                disabled={isLoading || !accountDetails.username || usernameError}
                                loading={isLoading}
                                style={{ ...buttonStyle, height: "32px", padding: "0 1rem" }}
                              >
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                disabled={isLoading}
                                style={{ ...buttonStyle, backgroundColor: "#666", height: "32px", padding: "0 1rem" }}
                              >
                                Cancel
                              </Button>
                            </>
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
                            <img src="/mail.svg" alt="Email" style={detailIconStyle} />
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
                            <>
                              <Button
                                variant="primary"
                                onClick={() => handleSaveField("email")}
                                disabled={isLoading || !accountDetails.email || emailError}
                                loading={isLoading}
                                style={{ ...buttonStyle, height: "32px", padding: "0 1rem" }}
                              >
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                disabled={isLoading}
                                style={{ ...buttonStyle, backgroundColor: "#666", height: "32px", padding: "0 1rem" }}
                              >
                                Cancel
                              </Button>
                            </>
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
                          <img src="/lock.svg" alt="Serial Key" style={detailIconStyle} />
                          <Text as="span" style={detailStyle}>
                            {createdAccount.serialkey || "N/A"}
                          </Text>
                        </div>
                      </div>
                      <div style={inputWrapperStyle}>
                        <label htmlFor="shop" style={labelStyle}>Shop</label>
                        <div style={nonEditableDetailItemStyle}>
                          <img src="/shopify.svg" alt="Shop" style={shopImageStyle} />
                          <Text as="span" style={detailStyle}>
                            {createdAccount.shop || "N/A"}
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
                          style={{ ...buttonStyle, backgroundColor: "#ff4d4f" }}
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
                            <img src="/user.svg" alt="User" style={detailIconStyle} />
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
                            <img src="/mail.svg" alt="Email" style={detailIconStyle} />
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
              <Card style={formContainerStyle}>
                <Text as="h3" variant="headingMd" style={{ padding: "1rem", color: "#2d3748" }}>
                  Configuration
                </Text>
                <div style={{ padding: "1rem" }}>
                  <Form method="post">
                    <input type="hidden" name="actionType" value="settings" />
                    <input type="hidden" name="serialKey" value={formState.serialKey} />
                    <div style={inputWrapperStyle}>
                      <label htmlFor="serialkey" style={labelStyle}>Serial Key</label>
                      <div style={inputContainerStyle}>
                        <img src="/lock.svg" alt="Serial Key" style={detailIconStyle} />
                        <Text as="span" style={inputStyle}>
                          {formState.serialKey}
                        </Text>
                      </div>
                    </div>
                    <div style={inputWrapperStyle}>
                      <label htmlFor="status" style={labelStyle}>Status</label>
                      <div style={{ position: "relative" }}>
                        <div
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          onKeyDown={(e) => handleDropdownKeyDown(e, setIsStatusDropdownOpen)}
                          style={dropdownToggleStyle}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isStatusDropdownOpen}
                          aria-controls="status-dropdown"
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <img
                              src={formState.status === "enabled" ? "/enabled.svg" : "/disabled.svg"}
                              alt={formState.status === "enabled" ? "Enabled" : "Disabled"}
                              style={statusIconStyle}
                            />
                            <Text as="span" variant="bodyMd">
                              {formState.status === "enabled" ? "Enabled" : "Disabled"}
                            </Text>
                          </div>
                          <img
                            src={isStatusDropdownOpen ? "/dropup.svg" : "/dropdown.svg"}
                            alt={isStatusDropdownOpen ? "Collapse" : "Expand"}
                            style={sectionIconStyle}
                          />
                        </div>
                        {isStatusDropdownOpen && (
                          <div id="status-dropdown" style={dropdownMenuStyle}>
                            <div
                              onClick={() => handleInputChange("status", "enabled")}
                              style={{
                                ...dropdownItemStyle,
                                ...(formState.status === "enabled" ? dropdownItemSelectedStyle : {}),
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  formState.status === "enabled"
                                    ? dropdownItemSelectedStyle.backgroundColor
                                    : "transparent")
                              }
                              role="option"
                              aria-selected={formState.status === "enabled"}
                            >
                              <img src="/enabled.svg" alt="Enabled" style={statusIconStyle} />
                              <Text as="span" variant="bodyMd">
                                Enabled
                              </Text>
                            </div>
                            <div
                              onClick={() => handleInputChange("status", "disabled")}
                              style={{
                                ...dropdownItemStyle,
                                ...(formState.status === "disabled" ? dropdownItemSelectedStyle : {}),
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  formState.status === "disabled"
                                    ? dropdownItemSelectedStyle.backgroundColor
                                    : "transparent")
                              }
                              role="option"
                              aria-selected={formState.status === "disabled"}
                            >
                              <img src="/disabled.svg" alt="Disabled" style={statusIconStyle} />
                              <Text as="span" variant="bodyMd">
                                Disabled
                              </Text>
                            </div>
                          </div>
                        )}
                        <input type="hidden" name="status" value={formState.status} />
                      </div>
                    </div>
                    <div style={inputWrapperStyle}>
                      <label htmlFor="displayStyle" style={labelStyle}>Display Style</label>
                      <div style={{ position: "relative" }}>
                        <div
                          onClick={() => setIsDisplayStyleDropdownOpen(!isDisplayStyleDropdownOpen)}
                          onKeyDown={(e) => handleDropdownKeyDown(e, setIsDisplayStyleDropdownOpen)}
                          style={dropdownToggleStyle}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isDisplayStyleDropdownOpen}
                          aria-controls="display-style-dropdown"
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <img
                              src={formState.displayStyle === "grid" ? "/grid_dis.svg" : "/carousel.svg"}
                              alt={formState.displayStyle === "grid" ? "Grid" : "Owl Carousel"}
                              style={statusIconStyle}
                            />
                            <Text as="span" variant="bodyMd">
                              {formState.displayStyle === "grid" ? "Grid" : "Owl Carousel"}
                            </Text>
                          </div>
                          <img
                            src={isDisplayStyleDropdownOpen ? "/dropup.svg" : "/dropdown.svg"}
                            alt={isDisplayStyleDropdownOpen ? "Collapse" : "Expand"}
                            style={sectionIconStyle}
                          />
                        </div>
                        {isDisplayStyleDropdownOpen && (
                          <div id="display-style-dropdown" style={dropdownMenuStyle}>
                            <div
                              onClick={() => handleInputChange("displayStyle", "grid")}
                              style={{
                                ...dropdownItemStyle,
                                ...(formState.displayStyle === "grid" ? dropdownItemSelectedStyle : {}),
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  formState.displayStyle === "grid"
                                    ? dropdownItemSelectedStyle.backgroundColor
                                    : "transparent")
                              }
                              role="option"
                              aria-selected={formState.displayStyle === "grid"}
                            >
                              <img src="/grid_dis.svg" alt="Grid" style={statusIconStyle} />
                              <Text as="span" variant="bodyMd">
                                Grid
                              </Text>
                            </div>
                            <div
                              onClick={() => handleInputChange("displayStyle", "owl")}
                              style={{
                                ...dropdownItemStyle,
                                ...(formState.displayStyle === "owl" ? dropdownItemSelectedStyle : {}),
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  formState.displayStyle === "owl"
                                    ? dropdownItemSelectedStyle.backgroundColor
                                    : "transparent")
                              }
                              role="option"
                              aria-selected={formState.displayStyle === "owl"}
                            >
                              <img src="/carousel.svg" alt="Owl Carousel" style={statusIconStyle} />
                              <Text as="span" variant="bodyMd">
                                Owl Carousel
                              </Text>
                            </div>
                          </div>
                        )}
                        <input type="hidden" name="displayStyle" value={formState.displayStyle} />
                      </div>
                    </div>
                    <div style={inputWrapperStyle}>
                      <label htmlFor="reviewLimit" style={labelStyle}>Number of Reviews to Display</label>
                      <div style={inputContainerStyle}>
                        <img src="/no_review.svg" alt="Number of Reviews" style={detailIconStyle} />
                        <TextField
                          type="number"
                          name="reviewLimit"
                          value={formState.reviewLimit}
                          onChange={(value) => handleInputChange("reviewLimit", value)}
                          min="1"
                          required
                          inputMode="numeric"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={inputWrapperStyle}>
                      <label htmlFor="reviewDisplayHeading" style={labelStyle}>Review Display Heading</label>
                      <div style={inputContainerStyle}>
                        <img src="/review_dis_title.svg" alt="Review Display Heading" style={detailIconStyle} />
                        <TextField
                          type="text"
                          name="reviewDisplayHeading"
                          value={formState.reviewDisplayHeading}
                          onChange={(value) => handleInputChange("reviewDisplayHeading", value)}
                          required
                          inputMode="text"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={inputWrapperStyle}>
                      <label htmlFor="reviewFormHeading" style={labelStyle}>Review Form Heading</label>
                      <div style={inputContainerStyle}>
                        <img src="/formtitle.svg" alt="Review Form Heading" style={detailIconStyle} />
                        <TextField
                          type="text"
                          name="reviewFormHeading"
                          value={formState.reviewFormHeading}
                          onChange={(value) => handleInputChange("reviewFormHeading", value)}
                          required
                          inputMode="text"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={buttonContainerStyle}>
                      <Button
                        variant="primary"
                        submit
                        disabled={isLoading}
                        loading={isLoading}
                        style={buttonStyle}
                      >
                        Update
                      </Button>
                    </div>
                  </Form>
                </div>
              </Card>
            </Layout.Section>
          )}
          {toast.active && (
            <Toast
              content={toast.content}
              error={toast.error}
              onDismiss={() => setToast({ active: false, content: "", error: false })}
              duration={TOAST_DURATION}
            />
          )}
          {showDeleteModal && (
            <Modal
              open={showDeleteModal}
              onClose={handleDeleteCancel}
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
                  onAction: handleDeleteCancel,
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
          {isLoading && <FullScreenLoader />}
         </Layout>
        </Page>
      </Frame>
    );
  }
