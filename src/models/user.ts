import { Schema, model } from "mongoose";
import { isEmail } from "validator";
import bcrypt from "bcrypt";

export type AuthUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
};

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email field is required"],
      unique: true,
      validate: [isEmail, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Minimum password length is 8 characters"],
    },
    firstName: {
      type: String,
      required: [true, "First name field is required"],
    },
    lastName: {
      type: String,
      required: [true, "last name field is required"],
    },
  },
  {
    timestamps: true,
    statics: {
      // Static method to login user
      async login(email: string, password: string) {
        const user = await this.findOne({ email });

        if (user) {
          const auth = await bcrypt.compare(password, user.password);

          if (auth) {
            return user;
          }
        }

        throw Error("Incorrect email or password");
      },
    },
  }
);

UserSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

export const User = model("user", UserSchema);
