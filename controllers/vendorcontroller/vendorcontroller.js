import Vendor from "../../models/venderschema.js";
import Store from "../../models/Stores/storeschema.js";
import FashionStore from "../../models/Stores/fashionstoreschema.js";
import User from "../../models/userschema.js";
import { calculateDistance } from "../../utils/distance.js";
import Category from "../../models/categories/categoryschema.js";
import { generateOtp } from "../../utils/generateOtp.js";
import jwt from "jsonwebtoken";

// Vendor ---------- >

export const createVendor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      shopName,
      shopDescription,
      category,
      street,
      city,
      state,
      pincode,
      landmark,
      lat,
      lng,
      aadharNumber,
      panNumber,
      gstNumber,
    } = req.body;

    // ================= VALIDATION =================
    if (
      !name ||
      !phone ||
      !shopName ||
      !category ||
      !street ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // ================= CATEGORY VALIDATION =================
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id",
      });
    }

    // ================= DUPLICATE CHECK / RE-REGISTER =================
    let vendorExist = await Vendor.findOne({ phone });

    if (vendorExist) {
      if (vendorExist.status === "rejected") {
        // ================= RE-REGISTER REJECTED VENDOR =================
        vendorExist.name = name;
        vendorExist.email = email;
        vendorExist.shop = {
          name: shopName,
          description: shopDescription,
          category: categoryExists._id,
          shopImage:
            req.files?.shopImage?.[0]?.path || vendorExist.shop.shopImage,
          documents: {
            shopLicense:
              req.files?.shopLicense?.[0]?.path ||
              vendorExist.shop.documents.shopLicense,
            fssai:
              req.files?.fssai?.[0]?.path || vendorExist.shop.documents.fssai,
          },
          address: {
            street,
            city,
            state,
            pincode,
            landmark,
          },
          geoLocation: {
            lat,
            lng,
          },
          verified: false,
        };
        vendorExist.aadhar.numberMasked = aadharNumber;
        vendorExist.aadhar.documentImage =
          req.files?.aadharDoc?.[0]?.path || vendorExist.aadhar.documentImage;
        vendorExist.pan.number = panNumber;
        vendorExist.pan.documentImage =
          req.files?.panDoc?.[0]?.path || vendorExist.pan.documentImage;
        vendorExist.gst.number = gstNumber;
        vendorExist.gst.documentImage =
          req.files?.gstDoc?.[0]?.path || vendorExist.gst.documentImage;

        vendorExist.status = "pending";
        vendorExist.approved = false;
        vendorExist.rejectionReason = null;
        vendorExist.loginMethod = "phone";

        await vendorExist.save();

        return res.status(200).json({
          success: true,
          message:
            "Vendor re-registered successfully. Please wait for admin approval.",
          vendorId: vendorExist._id,
        });
      } else {
        return res.status(409).json({
          success: false,
          message: "Vendor already applied with this phone number",
        });
      }
    }

    // ================= FILES =================
    const profileImage = req.files?.profileImage?.[0]?.path || null;
    const shopImage = req.files?.shopImage?.[0]?.path || null;
    const shopLicense = req.files?.shopLicense?.[0]?.path || null;
    const fssai = req.files?.fssai?.[0]?.path || null;
    const aadharDoc = req.files?.aadharDoc?.[0]?.path || null;
    const panDoc = req.files?.panDoc?.[0]?.path || null;
    const gstDoc = req.files?.gstDoc?.[0]?.path || null;

    // ================= CREATE NEW VENDOR =================
    const vendor = await Vendor.create({
      name,
      email,
      phone,
      profileImage,

      shop: {
        name: shopName,
        description: shopDescription,
        category: categoryExists._id,
        shopImage,
        documents: {
          shopLicense,
          fssai,
        },
        address: {
          street,
          city,
          state,
          pincode,
          landmark,
        },
        geoLocation: {
          lat,
          lng,
        },
      },

      aadhar: {
        numberMasked: aadharNumber,
        documentImage: aadharDoc,
      },

      pan: {
        number: panNumber,
        documentImage: panDoc,
      },

      gst: {
        number: gstNumber,
        documentImage: gstDoc,
      },

      status: "pending",
      approved: false,
      loginMethod: "phone",
    });

    return res.status(201).json({
      success: true,
      message:
        "Vendor application submitted successfully. Please wait for admin approval.",
      vendorId: vendor._id,
    });
  } catch (error) {
    console.error("Vendor Create Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const sendVendorOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // ================= VALIDATION =================
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // ================= CHECK VENDOR =================
    const vendor = await Vendor.findOne({ phone });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not registered",
      });
    }

    // ================= ADMIN APPROVAL CHECK =================
    if (!vendor.approved || vendor.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          vendor.status === "rejected"
            ? `Application rejected: ${
                vendor.rejectionReason || "Contact support"
              }`
            : "Your application is under review. Please wait for admin approval.",
      });
    }

    // ================= GENERATE OTP =================
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    vendor.otp = otp;
    vendor.otpExpiry = otpExpiry;
    vendor.loginMethod = "phone";

    await vendor.save();

    // ================= MOCK SEND =================
    console.log(`Vendor OTP for ${phone}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      vendorId: vendor._id,
      otp, // ❌ remove in production
    });
  } catch (error) {
    console.error("Send Vendor OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const verifyVendorOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // ================= VALIDATION =================
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    // ================= FIND VENDOR =================
    const vendor = await Vendor.findOne({ phone }).select(
      "+otp +otpExpiry approved status"
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.status === "rejected") {
      return res.status(403).json({
        success: false,
        message: `Your application has been rejected. Reason: ${
          vendor.rejectionReason || "Contact admin"
        }`,
      });
    }
    // ================= ADMIN APPROVAL CHECK =================
    if (!vendor.approved || vendor.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Vendor not approved by admin yet",
      });
    }

    // ================= OTP EXISTS =================
    if (!vendor.otp || !vendor.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP not generated",
      });
    }

    // ================= OTP EXPIRY =================
    if (vendor.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // ================= OTP MATCH =================
    if (vendor.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ================= MARK VERIFIED =================
    vendor.otp = undefined;
    vendor.otpExpiry = undefined;
    vendor.verified = true;

    await vendor.save();

    // ================= GENERATE TOKEN =================
    const token = jwt.sign(
      {
        id: vendor._id,
        role: "vendor",
      },
      process.env.JWT_VENDOR_KEY,
      { expiresIn: "70d" }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        phone: vendor.phone,
        shopName: vendor.shop?.name,
        approved: vendor.approved,
      },
    });
  } catch (error) {
    console.error("Verify Vendor OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const vendorProfile = async (req, res) => {
  console.log("Vendor profile contorller is hitting ------ >");
  try {
    const vendor = req.vendor;
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "No vendor Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Vendor profile found successfully ",
      vendor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Vendor Profile, Internal Server Error!",
    });
  }
};

// PUT /vendor/update-rejected
export const updateRejectedVendor = async (req, res) => {
  console.log("Vendor Reject update Controller is hitting");
  try {
    const { phone } = req.body;
    const vendor = await Vendor.findOne({ phone });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Only rejected vendors can update application",
      });
    }

    // ============ BASIC FIELDS ============
    if (req.body.name) vendor.name = req.body.name;
    if (req.body.email) vendor.email = req.body.email;

    // ============ SHOP ============
    if (req.body.shopName) vendor.shop.name = req.body.shopName;
    if (req.body.shopDescription)
      vendor.shop.description = req.body.shopDescription;

    // ============ ADDRESS ============
    vendor.shop.address = {
      ...vendor.shop.address,
      ...req.body.address,
    };

    // ============ GEO ============
    if (req.body.geoLocation) {
      vendor.shop.geoLocation = {
        lat: req.body.geoLocation.lat,
        lng: req.body.geoLocation.lng,
      };
    }

    // ============ DOCUMENTS ============
    if (req.files?.shopLicense) {
      vendor.shop.documents.shopLicense = req.files.shopLicense[0].path;
    }

    if (req.files?.fssai) {
      vendor.shop.documents.fssai = req.files.fssai[0].path;
    }

    if (req.files?.panDoc) {
      vendor.pan.documentImage = req.files.panDoc[0].path;
    }

    if (req.files?.aadharDoc) {
      vendor.aadhar.documentImage = req.files.aadharDoc[0].path;
    }

    // ============ RESET STATUS ============
    vendor.status = "pending";
    vendor.approved = false;
    vendor.rejectionReason = null;
    vendor.rejectedFields = [];

    await vendor.save();

    return res.status(200).json({
      success: true,
      
      message:
        "Application updated successfully and sent again for admin approval",
        vendor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update vendor application",
    });
  }
};
//This is Grocerry Store  --- >

export const createStore = async (req, res) => {
  try {
    const vendor = req.vendor;

    if (!vendor?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let {
      storeName,
      description,
      phone,
      email,
      address,

      geoLocation,
      openingHours,
      status,
      delivery,
      tax,
    } = req.body;

    if (!storeName) {
      return res.status(400).json({
        success: false,
        message: "Store name required",
      });
    }

    // Parse JSON strings
    if (typeof address === "string") address = JSON.parse(address);
    if (typeof geoLocation === "string") geoLocation = JSON.parse(geoLocation);
    if (typeof openingHours === "string")
      openingHours = JSON.parse(openingHours);
    if (typeof delivery === "string") delivery = JSON.parse(delivery);
    if (typeof tax === "string") tax = JSON.parse(tax);

    // Geo validation
    if (geoLocation?.lat === undefined || geoLocation?.lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "Geo location required",
      });
    }

    // ✅ Correct image handling
    const storeImage = req.file ? req.file.path : null;

    const store = await Store.create({
      vendorId: vendor._id,
      storeName,
      storeImage,
      description: description || "",
      phone: phone || "",
      email: email || "",

      address: {
        street: address?.street || "",
        city: address?.city || "",
        state: address?.state || "",
        pincode: address?.pincode || "",
        landmark: address?.landmark || "",
      },

      geoLocation: {
        lat: geoLocation.lat,
        lng: geoLocation.lng,
      },

      openingHours: {
        open: openingHours?.open || "09:00",
        close: openingHours?.close || "21:00",
      },

      status: status || "active",

      delivery: {
        type: delivery?.type || "per_km",
        perKmCharge: delivery?.perKmCharge || 0,
        flatCharge: delivery?.flatCharge || 0,
        maxRadiusKm: delivery?.maxRadiusKm || 10,
        baseDeliveryTime: delivery?.baseDeliveryTime || 20,
        timePerKm: delivery?.timePerKm || 5,
      },

      tax: {
        gstPercent: tax?.gstPercent || 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStore = async (req, res) => {
  try {
    const vendorId = req.vendor?._id;
    // const storeId = req.params._id;
    const { id } = req.params;

    console.log("UPDATE STORE => vendorId:", vendorId);
    console.log("UPDATE STORE => storeId:", id);
    console.log("UPDATE STORE => body:", req.body);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const store = await Store.findOne({
      _id: id,
      vendorId,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found or access denied",
      });
    }

    let {
      storeName,
      description,
      phone,
      email,
      address,
      geoLocation,
      openingHours,
      status,
      delivery,
      tax,
    } = req.body;

    // 🧠 Parse JSON strings (same as createStore)
    if (typeof address === "string") address = JSON.parse(address);
    if (typeof geoLocation === "string") geoLocation = JSON.parse(geoLocation);
    if (typeof openingHours === "string")
      openingHours = JSON.parse(openingHours);
    if (typeof delivery === "string") delivery = JSON.parse(delivery);
    if (typeof tax === "string") tax = JSON.parse(tax);

    // 🔍 Geo validation (only if provided)
    if (geoLocation) {
      console.log("GeoLocation update requested:", geoLocation);

      if (geoLocation.lat === undefined || geoLocation.lng === undefined) {
        return res.status(400).json({
          success: false,
          message: "Invalid geo location",
        });
      }

      store.geoLocation.lat = geoLocation.lat;
      store.geoLocation.lng = geoLocation.lng;
    }

    // 🖼️ Image update (optional)
    if (req.file) {
      console.log("Updating store image:", req.file.path);
      store.storeImage = req.file.path;
    }

    // ✏️ Basic fields
    if (storeName) store.storeName = storeName;
    if (description !== undefined) store.description = description;
    if (phone !== undefined) store.phone = phone;
    if (email !== undefined) store.email = email.toLowerCase();
    if (status) store.status = status;

    // 🏠 Address update
    if (address) {
      store.address.street = address.street ?? store.address.street;
      store.address.city = address.city ?? store.address.city;
      store.address.state = address.state ?? store.address.state;
      store.address.pincode = address.pincode ?? store.address.pincode;
      store.address.landmark = address.landmark ?? store.address.landmark;
    }

    // ⏰ Opening hours
    if (openingHours) {
      store.openingHours.open = openingHours.open ?? store.openingHours.open;
      store.openingHours.close = openingHours.close ?? store.openingHours.close;
    }

    // 🚚 Delivery update
    if (delivery) {
      store.delivery.type = delivery.type ?? store.delivery.type;
      store.delivery.perKmCharge =
        delivery.perKmCharge ?? store.delivery.perKmCharge;
      store.delivery.flatCharge =
        delivery.flatCharge ?? store.delivery.flatCharge;
      store.delivery.maxRadiusKm =
        delivery.maxRadiusKm ?? store.delivery.maxRadiusKm;
      store.delivery.baseDeliveryTime =
        delivery.baseDeliveryTime ?? store.delivery.baseDeliveryTime;
      store.delivery.timePerKm = delivery.timePerKm ?? store.delivery.timePerKm;
    }

    // 💰 Tax update
    if (tax) {
      if (tax.gstPercent < 0 || tax.gstPercent > 28) {
        return res.status(400).json({
          success: false,
          message: "GST percent must be between 0 and 28",
        });
      }
      store.tax.gstPercent = tax.gstPercent;
    }

    await store.save();

    console.log("STORE UPDATED SUCCESSFULLY");

    return res.status(200).json({
      success: true,
      message: "Store updated successfully",
      store,
    });
  } catch (error) {
    console.error("UPDATE STORE ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Error updating store",
      error: error.message,
    });
  }
};

// This is  fashion store  ----- >

export const createFashionStore = async (req, res) => {
  try {
    const vendor = req.vendor;

    if (!vendor?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let {
      storeName,
      description,
      phone,
      email,
      address,
      geoLocation,
      openingHours,
      status,
      shopCategory,
      brandsAvailable,
      hasTrialRoom,
      returnPolicyDays,
      exchangeAvailable,
      delivery,
      tax,
    } = req.body;

    if (!storeName) {
      return res.status(400).json({
        success: false,
        message: "Store name is required",
      });
    }

    if (geoLocation?.lat == null || geoLocation?.lng == null) {
      return res.status(400).json({
        success: false,
        message: "Geo location (lat, lng) is required",
      });
    }

    // ================= IMAGES =================
    const storeImage = req.file ? req.file.path : null;

    const store = await FashionStore.create({
      vendorId: vendor._id,
      storeName,
      storeImage,
      description: description || "",
      phone: phone || "",
      email: email || "",

      address: {
        street: address?.street || "",
        city: address?.city || "",
        state: address?.state || "",
        pincode: address?.pincode || "",
        landmark: address?.landmark || "",
      },

      geoLocation: {
        lat: geoLocation.lat,
        lng: geoLocation.lng,
      },

      openingHours: {
        open: openingHours?.open || "10:00",
        close: openingHours?.close || "22:00",
      },

      status: status || "active",

      shopCategory: shopCategory || "unisex",
      brandsAvailable: brandsAvailable || [],
      hasTrialRoom: hasTrialRoom || false,
      returnPolicyDays: returnPolicyDays || 0,
      exchangeAvailable: exchangeAvailable || false,

      delivery: {
        type: delivery?.type || "per_km",
        perKmCharge: delivery?.perKmCharge || 0,
        flatCharge: delivery?.flatCharge || 0,
        maxRadiusKm: delivery?.maxRadiusKm || 10,
        baseDeliveryTime: delivery?.baseDeliveryTime || 20,
        timePerKm: delivery?.timePerKm || 5,
      },

      tax: {
        gstPercent: tax?.gstPercent || 5,
      },
    });

    res.status(201).json({
      success: true,
      message: "Fashion store created successfully",
      store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateFashionStore = async (req, res) => {
  try {
    const vendorId = req.vendor?._id;
    const { id } = req.params;

    console.log("UPDATE FASHION STORE => vendorId:", vendorId);
    console.log("UPDATE FASHION STORE => storeId:", id);
    console.log("UPDATE FASHION STORE => body:", req.body);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 🔐 Vendor ownership check
    const store = await FashionStore.findOne({
      _id: id,
      vendorId,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Fashion store not found or access denied",
      });
    }

    let {
      storeName,
      description,
      phone,
      email,
      address,
      geoLocation,
      openingHours,
      status,
      shopCategory,
      brandsAvailable,
      hasTrialRoom,
      returnPolicyDays,
      exchangeAvailable,
      delivery,
      tax,
    } = req.body;

    // 🖼️ Image update
    if (req.file) {
      console.log("Updating store image:", req.file.path);
      store.storeImage = req.file.path;
    }

    // ✏️ Basic fields
    if (storeName) store.storeName = storeName;
    if (description !== undefined) store.description = description;
    if (phone !== undefined) store.phone = phone;
    if (email !== undefined) store.email = email.toLowerCase();
    if (status) store.status = status;

    // 🏠 Address update
    if (address) {
      store.address.street = address.street ?? store.address.street;
      store.address.city = address.city ?? store.address.city;
      store.address.state = address.state ?? store.address.state;
      store.address.pincode = address.pincode ?? store.address.pincode;
      store.address.landmark = address.landmark ?? store.address.landmark;
    }

    // 🌍 Geo location (validate only if provided)
    if (geoLocation) {
      if (geoLocation.lat == null || geoLocation.lng == null) {
        return res.status(400).json({
          success: false,
          message: "Geo location (lat, lng) is required",
        });
      }
      store.geoLocation.lat = geoLocation.lat;
      store.geoLocation.lng = geoLocation.lng;
    }

    // ⏰ Opening hours
    if (openingHours) {
      store.openingHours.open = openingHours.open ?? store.openingHours.open;
      store.openingHours.close = openingHours.close ?? store.openingHours.close;
    }

    // 👕 Fashion specific fields
    if (shopCategory) store.shopCategory = shopCategory;
    if (brandsAvailable) store.brandsAvailable = brandsAvailable;
    if (hasTrialRoom !== undefined) store.hasTrialRoom = hasTrialRoom;
    if (returnPolicyDays !== undefined)
      store.returnPolicyDays = returnPolicyDays;
    if (exchangeAvailable !== undefined)
      store.exchangeAvailable = exchangeAvailable;

    // 🚚 Delivery
    if (delivery) {
      store.delivery.type = delivery.type ?? store.delivery.type;
      store.delivery.perKmCharge =
        delivery.perKmCharge ?? store.delivery.perKmCharge;
      store.delivery.flatCharge =
        delivery.flatCharge ?? store.delivery.flatCharge;
      store.delivery.maxRadiusKm =
        delivery.maxRadiusKm ?? store.delivery.maxRadiusKm;
      store.delivery.baseDeliveryTime =
        delivery.baseDeliveryTime ?? store.delivery.baseDeliveryTime;
      store.delivery.timePerKm = delivery.timePerKm ?? store.delivery.timePerKm;
    }

    // 💰 Tax
    if (tax) {
      if (tax.gstPercent < 0 || tax.gstPercent > 28) {
        return res.status(400).json({
          success: false,
          message: "GST percent must be between 0 and 28",
        });
      }
      store.tax.gstPercent = tax.gstPercent;
    }

    await store.save();

    console.log("FASHION STORE UPDATED SUCCESSFULLY");

    return res.status(200).json({
      success: true,
      message: "Fashion store updated successfully",
      store,
    });
  } catch (error) {
    console.error("UPDATE FASHION STORE ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllStores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // Fetch data from all collections
    const [fashionStores, groceryStores] = await Promise.all([
      FashionStore.find().populate("vendorId", "name phone email").lean(),

      Store.find().populate("vendorId", "name phone email").lean(),
    ]);

    // Add storeType manually
    const allStores = [
      ...fashionStores.map((s) => ({ ...s, storeType: "fashion" })),
      ...groceryStores.map((s) => ({ ...s, storeType: "grocery" })),
    ];

    // Sort by createdAt
    allStores.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination manually
    const paginatedStores = allStores.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      totalStores: allStores.length,
      currentPage: page,
      totalPages: Math.ceil(allStores.length / limit),
      stores: paginatedStores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllFashionStores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // optional filters
    const { shopCategory, city, status, search } = req.query;

    const filter = {};

    if (shopCategory) filter.shopCategory = shopCategory;
    if (status) filter.status = status;
    if (city) filter["address.city"] = city;

    if (search) {
      filter.storeName = { $regex: search, $options: "i" };
    }

    const stores = await FashionStore.find(filter)
      .populate("vendorId", "name phone email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalStores = await FashionStore.countDocuments(filter);

    res.status(200).json({
      success: true,
      totalStores,
      currentPage: page,
      totalPages: Math.ceil(totalStores / limit),
      hasNextPage: page * limit < totalStores,
      stores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch fashion stores",
      error: error.message,
    });
  }
};

export const getFashionStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await FashionStore.findById(id).populate(
      "vendorId",
      "name phone email"
    );

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Fashion store not found",
      });
    }

    res.status(200).json({
      success: true,
      store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID",
      });
    }

    const store = await Store.findById(id)
      .populate("vendorId", "phone profileImage name ")
      .lean();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Store fetched successfully",
      store,
    });
  } catch (error) {
    console.error("GET STORE BY ID ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Delete Store via vendor is pending ?

export const deleteStore = async (req, res) => {
  try {
    const vendorId = req.vendor?._id;
    const storeId = req.params.storeId;

    console.log("DELETE STORE => vendorId:", vendorId);
    console.log("DELETE STORE => storeId:", storeId);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 🔐 Vendor ownership check
    const store = await Store.findOne({
      _id: storeId,
      vendorId,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found or access denied",
      });
    }

    // ✅ Soft delete
    store.status = "inactive";
    await store.save();

    console.log("STORE SOFT DELETED SUCCESSFULLY");

    return res.status(200).json({
      success: true,
      message: "Store deleted successfully",
    });
  } catch (error) {
    console.error("DELETE STORE ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting store",
      error: error.message,
    });
  }
};

export const getStoresWithDistance = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user || !user.geoLocation) {
      return res.status(404).json({
        success: false,
        message: "User location not found",
      });
    }

    const { lat: userLat, lng: userLng } = user.geoLocation;

    const stores = await Store.find({ status: "active" }).populate(
      "vendorId",
      "phone"
    );

    const storesWithDistance = stores.map((store) => {
      const storeLat = store.geoLocation.lat;
      const storeLng = store.geoLocation.lng;

      const distance = calculateDistance(userLat, userLng, storeLat, storeLng);

      return {
        ...store.toObject(),
        distance: distance.toFixed(2) + " km",
      };
    });

    res.status(200).json({
      success: true,
      stores: storesWithDistance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
