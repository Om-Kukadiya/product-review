import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, Form, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Button,
  Layout,
  Spinner,
  TextField,
  Modal,
} from "@shopify/polaris";
import {
  HomeOutlined,
  ProductOutlined,
  SettingOutlined,
  UserOutlined,
  MailOutlined,
  KeyOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Define a common style for navigation icons
const baseIconStyle = {
  fontSize: "24px",
  cursor: "pointer",
  border: "1px solid #96BF47",
  color: "#073E74",
  padding: "4px",
  borderRadius: "4px",
};

// Define a style for the account icon (now an image)
const accountIconStyle = {
  width: "34px",
  height: "34px",
  cursor: "pointer",
  backgroundColor: "#073E74",
  padding: "4px",
  borderRadius: "4px",
  objectFit: "contain",
};

// Define styles for the account form and details
const formContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  padding: "1.5rem",
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

const inputWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const inputContainerStyle = {
  border: "1px solid #d1d1d1",
  borderRadius: "4px",
  padding: "0.5rem",
  backgroundColor: "#fff",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const inputStyle = {
  border: "none",
  padding: "0.5rem",
  fontSize: "14px",
  fontFamily: "inherit",
  flex: 1,
  backgroundColor: "transparent",
};

const detailStyle = {
  border: "none",
  padding: "0.5rem",
  backgroundColor: "#fff",
  flex: 1,
};

const detailItemStyle = {
  border: "1px solid #d1d1d1",
  borderRadius: "4px",
  padding: "0.5rem",
  backgroundColor: "#fff",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  justifyContent: "space-between",
};

const nonEditableDetailItemStyle = {
  border: "1px solid #d1d1d1",
  borderRadius: "4px",
  padding: "0.5rem",
  backgroundColor: "white",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#333",
};

const errorStyle = {
  color: "#ff4d4f",
  fontSize: "12px",
  marginTop: "0.25rem",
};

const buttonStyle = {
  backgroundColor: "#000",
  color: "#fff",
  borderRadius: "50px",
  padding: "0.5rem 1.5rem",
  fontSize: "14px",
  textAlign: "center",
  lineHeight: "1.2",
  border: "none",
};

const detailIconStyle = {
  fontSize: "18px",
  color: "white",
  backgroundColor: "#073E74",
  padding: "4px",
  borderRadius: "4px",
};

const editIconStyle = {
  fontSize: "18px",
  color: "#073E74",
  cursor: "pointer",
};

const shopImageStyle = {
  width: "26px",
  height: "26px",
  objectFit: "cover",
  backgroundColor: "#E8E8E8",
  borderRadius: "4px",
};

const buttonContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "1rem",
  marginTop: "1.5rem",
};

const FullScreenLoader_MI = () => (
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

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const url = new URL(request.url);
    let shop = url.searchParams.get("shop") || session?.shop;
    if (!shop) {
      return redirect("/auth?shop=not-provided");
    }
    if (!shop.includes(".myshopify.com")) {
      return redirect("/auth?shop=invalid");
    }
    const existingAccount_MI = await prisma.account.findFirst({
      where: { shop },
    });
    return json({
      isAuthenticated: true,
      message: "Welcome to Product Review App",
      shop,
      existingAccount_MI,
    });
  } catch (error) {
    return redirect("/auth?error=authentication-failed");
  }
};

export const action = async ({ request }) => {
  try {
    if (!prisma) {
      throw new Error("Prisma client is not initialized");
    }
    if (!prisma.account) {
      throw new Error("Account model is not available on Prisma client");
    }
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);
    let shop = url.searchParams.get("shop") || session?.shop;
    if (!shop) {
      return redirect("/auth?shop=not-provided");
    }
    if (!shop.includes(".myshopify.com")) {
      return redirect("/auth?shop=invalid");
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
      const account_MI = await prisma.account.findUnique({
        where: { serialkey },
      });
      if (!account_MI) {
        return json(
          { success: false, error: "Account not found" },
          { status: 404 }
        );
      }
      await prisma.$transaction([
        prisma.rating.deleteMany({
          where: { shop: account_MI.shop },
        }),
        prisma.settings.deleteMany({
          where: { key: { startsWith: serialkey } },
        }),
        prisma.account.delete({
          where: { serialkey },
        }),
      ]);
      return redirect(`/app?shop=${encodeURIComponent(shop)}`);
    }
    if (actionType === "edit") {
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
      const updatedAccount_MI = await prisma.account.update({
        where: { serialkey },
        data: {
          ...updateData,
          updatedat: new Date(),
        },
      });
      return json({ success: true, account: updatedAccount_MI, message: "Account updated successfully" }, { status: 200 });
    }
    const username = formData.get("username");
    const email = formData.get("email");
    if (!username || !email || !shop) {
      return json(
        { success: false, error: "All fields (username, email, shop) are required" },
        { status: 400 }
      );
    }
    const existingAccount_MI = await prisma.account.findFirst({
      where: { shop },
    });
    if (existingAccount_MI) {
      return json(
        { success: true, account: existingAccount_MI, message: "Account already exists for this shop" },
        { status: 200 }
      );
    }
    const serialkey = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const account_MI = await prisma.account.create({
      data: {
        username,
        email,
        serialkey,
        shop,
        plan: 'FREE',
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
        where: { key: `${serialkey}_reviewFormHeading` },
        update: { value: "Customer Reviews" },
        create: { key: `${serialkey}_reviewFormHeading`, value: "Customer Reviews" },
      }),
      prisma.settings.upsert({
        where: { key: `${serialkey}_submitButtonText` },
        update: { value: "Submit Your Reviews" },
        create: { key: `${serialkey}_submitButtonText`, value: "Submit Your Reviews" },
      }),
    ]);
    return json({ success: true, account: account_MI, message: "Account created successfully" }, { status: 200 });
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
  }
};

export default function AccountManagement({ currentPath }) {
  const { isAuthenticated, message, shop, existingAccount_MI } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [showAccount_MI, setShowAccount_MI] = useState(false);
  const [account_MI, setAccount_MI] = useState({ username: "", email: "" });
  const [createdAccount_MI, setCreatedAccount_MI] = useState(existingAccount_MI);
  const [emailError_MI, setEmailError_MI] = useState("");
  const [isEditing_MI, setIsEditing_MI] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showDeleteModal_MI, setShowDeleteModal_MI] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(!!existingAccount_MI);
  const isLoading = navigation.state === "loading" || navigation.state === "submitting";

  const homeIconStyle = {
    ...baseIconStyle,
    backgroundColor: showAccount_MI ? "#f0f0f0" : (currentPath === "/app" ? "#96BF47" : "#f0f0f0"),
  };

  const productIconStyle = {
    ...baseIconStyle,
    backgroundColor: currentPath === "/app/dis_rating_admin" ? "#96BF47" : "#f0f0f0",
  };

  const settingIconStyle = {
    ...baseIconStyle,
    backgroundColor: currentPath === "/app/star-rating-settings" ? "#96BF47" : "#f0f0f0",
  };

  const validateEmail_MI = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleEmailChange = (value) => {
    setAccount_MI({ ...account_MI, email: value });
    setEmailError_MI(validateEmail_MI(value));
  };

  const handleEditClick = (field) => {
    setEditingField(field);
    setAccount_MI({
      username: createdAccount_MI?.username || "",
      email: createdAccount_MI?.email || "",
    });
  };

  const handleEditAllClick = () => {
    setIsEditing_MI(true);
    setAccount_MI({
      username: createdAccount_MI?.username || "",
      email: createdAccount_MI?.email || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setIsEditing_MI(false);
    setAccount_MI({ username: "", email: "" });
    setEmailError_MI("");
  };

  const handleSaveField = (field) => {
    if (field === "email" && emailError_MI) return;
    const formData = new FormData();
    formData.append("actionType", "edit");
    formData.append("serialkey", createdAccount_MI?.serialkey);
    formData.append(field, account_MI[field]);
    submit(formData, { method: "post" });
    setEditingField(null);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal_MI(true);
  };

  const handleDeleteConfirm = () => {
    if (!shop) {
      shopify.toast.show("Shop domain not detected. Please try again.", { duration: 5000, isError: true });
      return;
    }
    const formData = new FormData();
    formData.append("actionType", "delete");
    formData.append("serialkey", createdAccount_MI?.serialkey);
    formData.append("shop", shop);
    submit(formData, { method: "post" });
    setShowDeleteModal_MI(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal_MI(false);
  };

  useEffect(() => {
    if (actionData?.success) {
      if (actionData.message === "Account updated successfully" || actionData.message === "Account created successfully") {
        setCreatedAccount_MI(actionData.account);
        setAccount_MI({ username: "", email: "" });
        setEmailError_MI("");
        setIsEditing_MI(false);
        setEditingField(null);
        setIsContentVisible(true);
        shopify.toast.show(actionData.message, { duration: 5000 });
      }
    } else if (actionData?.error) {
      shopify.toast.show(actionData.error, { duration: 5000, isError: true });
    }
    setCreatedAccount_MI(existingAccount_MI);
  }, [actionData, existingAccount_MI]);

  return (
    <>
      <Layout.Section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "1rem" }}>
            <HomeOutlined
              style={homeIconStyle}
              onClick={() => {
                setShowAccount_MI(false);
                navigate(`/app?shop=${encodeURIComponent(shop)}`);
              }}
            />
            <ProductOutlined
              style={productIconStyle}
              onClick={() => {
                setShowAccount_MI(false);
                navigate(`/app/dis_rating_admin?shop=${encodeURIComponent(shop)}`);
              }}
            />
            <SettingOutlined
              style={settingIconStyle}
              onClick={() => {
                setShowAccount_MI(false);
                navigate(`/app/star-rating-settings?shop=${encodeURIComponent(shop)}`);
              }}
            />
          </div>
          {createdAccount_MI && (
            <img
              src="/shopify.svg"
              alt="Shopify"
              style={accountIconStyle}
              onClick={() => setShowAccount_MI(!showAccount_MI)}
            />
          )}
        </div>
      </Layout.Section>

      {showAccount_MI ? (
        <Layout.Section>
          <Card>
            <Text as="h3" variant="headingMd" style={{ padding: "1rem" }}>
              Account
            </Text>
            <div style={{ padding: "1rem" }}>
              {createdAccount_MI && !isEditing_MI ? (
                <div style={formContainerStyle}>
                  <Text as="p" variant="bodyMd" tone="subdued" style={{ marginBottom: "0.5rem" }}>
                    Account Details
                  </Text>
                  {/* Username */}
                  <div style={inputWrapperStyle}>
                    <label style={labelStyle}>Username</label>
                    <div style={detailItemStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                        <UserOutlined style={detailIconStyle} />
                        <Text as="span" style={detailStyle}>
                          {createdAccount_MI.username}
                        </Text>
                      </div>
                      {editingField === "username" ? (
                        <>
                          <TextField
                            id="username"
                            name="username"
                            value={account_MI.username}
                            onChange={(value) => setAccount_MI({ ...account_MI, username: value })}
                            inputMode="text"
                            style={inputStyle}
                          />
                          <Button
                            variant="primary"
                            onClick={() => handleSaveField("username")}
                            disabled={isLoading || !account_MI.username}
                            loading={isLoading}
                            style={buttonStyle}
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            disabled={isLoading}
                            style={{ ...buttonStyle, backgroundColor: "#666" }}
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
                  </div>
                  {/* Email */}
                  <div style={inputWrapperStyle}>
                    <label style={labelStyle}>Email</label>
                    <div style={detailItemStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                        <MailOutlined style={detailIconStyle} />
                        <Text as="span" style={detailStyle}>
                          {createdAccount_MI.email}
                        </Text>
                      </div>
                      {editingField === "email" ? (
                        <>
                          <TextField
                            id="email"
                            type="email"
                            name="email"
                            value={account_MI.email}
                            onChange={handleEmailChange}
                            error={emailError_MI}
                            inputMode="email"
                            style={inputStyle}
                          />
                          <Button
                            variant="primary"
                            onClick={() => handleSaveField("email")}
                            disabled={isLoading || !account_MI.email || emailError_MI}
                            loading={isLoading}
                            style={buttonStyle}
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            disabled={isLoading}
                            style={{ ...buttonStyle, backgroundColor: "#666" }}
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
                    {emailError_MI && editingField === "email" && (
                      <Text as="p" style={errorStyle}>
                        {emailError_MI}
                      </Text>
                    )}
                  </div>
                  {/* Serial Key */}
                  <div style={inputWrapperStyle}>
                    <label style={labelStyle}>Serial Key</label>
                    <div style={nonEditableDetailItemStyle}>
                      <KeyOutlined style={detailIconStyle} />
                      <Text as="span" style={detailStyle}>
                        {createdAccount_MI.serialkey}
                      </Text>
                    </div>
                  </div>
                  {/* Shop */}
                  <div style={inputWrapperStyle}>
                    <label style={labelStyle}>Shop</label>
                    <div style={nonEditableDetailItemStyle}>
                      <img src="/Frame7.jpg" alt="Shop" style={shopImageStyle} />
                      <Text as="span" style={detailStyle}>
                        {createdAccount_MI.shop}
                      </Text>
                    </div>
                  </div>
                  <div style={buttonContainerStyle}>
                    <Button
                      onClick={handleEditAllClick}
                      variant="primary"
                      disabled={isLoading}
                      style={buttonStyle}
                    >
                      Edit All
                    </Button>
                    <Button
                      onClick={handleDeleteClick}
                      variant="secondary"
                      tone="critical"
                      disabled={isLoading}
                      style={{ ...buttonStyle, backgroundColor: "#ff4d4f" }}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={formContainerStyle}>
                  <Text as="p" variant="bodyMd" tone="subdued" style={{ marginBottom: "0.5rem" }}>
                    {isEditing_MI ? "Edit Account Details" : "Add Account Details"}
                  </Text>
                  <Form method="post">
                    <input type="hidden" name="shop" value={shop} />
                    {isEditing_MI && (
                      <>
                        <input type="hidden" name="actionType" value="edit" />
                        <input type="hidden" name="serialkey" value={createdAccount_MI?.serialkey} />
                      </>
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
                          value={account_MI.username}
                          onChange={(value) => setAccount_MI({ ...account_MI, username: value })}
                          inputMode="text"
                          style={inputStyle}
                        />
                      </div>
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
                          value={account_MI.email}
                          onChange={handleEmailChange}
                          error={emailError_MI}
                          inputMode="email"
                          style={inputStyle}
                        />
                      </div>
                      {emailError_MI && (
                        <Text as="p" style={errorStyle}>
                          {emailError_MI}
                        </Text>
                      )}
                    </div>
                    {actionData?.error && (
                      <Text as="p" style={{ ...errorStyle, marginBottom: "1rem" }}>
                        {actionData.error}
                      </Text>
                    )}
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                      <Button
                        variant="primary"
                        submit
                        disabled={!account_MI.username || !account_MI.email || emailError_MI || isLoading}
                        loading={isLoading}
                        style={buttonStyle}
                      >
                        {isEditing_MI ? "Update Account" : "Save Account"}
                      </Button>
                      {isEditing_MI && (
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
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            {!createdAccount_MI && (
              <Button
                onClick={() => {
                  setIsContentVisible(true);
                  setShowAccount_MI(true);
                }}
                variant="primary"
                style={buttonStyle}
              >
                Create Account
              </Button>
            )}
          </div>
        </Layout.Section>
      )}

      {showDeleteModal_MI && (
        <Modal
          open={showDeleteModal_MI}
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
      {isLoading && <FullScreenLoader_MI />}
    </>
  );
}