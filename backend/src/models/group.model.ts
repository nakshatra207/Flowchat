import { Schema, model, Types, type InferSchemaType } from "mongoose";

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },
    description: {
      type: String,
      default: "",
      maxlength: 500
    },
    avatarUrl: {
      type: String,
      default: null,
      maxlength: 500
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    permissions: {
      onlyAdminsCanMessage: {
        type: Boolean,
        default: false
      },
      onlyAdminsCanInvite: {
        type: Boolean,
        default: false
      },
      onlyAdminsCanEditInfo: {
        type: Boolean,
        default: true
      }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

groupSchema.pre("validate", function ensureOwnerMembership(next) {
  if (this.owner) {
    const owner = new Types.ObjectId(this.owner);
    const memberIds = this.members.map((member) => member.toString());
    const adminIds = this.admins.map((admin) => admin.toString());

    if (!memberIds.includes(owner.toString())) {
      this.members.push(owner);
    }

    if (!adminIds.includes(owner.toString())) {
      this.admins.push(owner);
    }
  }

  next();
});

groupSchema.index({ name: "text", description: "text" });
groupSchema.index({ members: 1, updatedAt: -1 });
groupSchema.index({ admins: 1 });

export type GroupDocument = InferSchemaType<typeof groupSchema>;
export const Group = model("Group", groupSchema);

