/* Copied from original template except for class names for cards.
Classnames used:
-page
-page-center
-card 
-card--form

*/

"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
// import useLocalStorage from "@/hooks/useLocalStorage";
import { RegisterPostDTO, UserAuthDTO, LoginPostDTO } from "@/types/user";
import { Button, Form, Input } from "antd";
import { useAuth } from "@/context/AuthContext";


const Register: React.FC = () => {
  const {login} = useAuth();
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm<RegisterPostDTO>();


  const handleRegistration = async (values: RegisterPostDTO) => {
    values.isGuest = false;
    
    try {
      await apiService.post<UserAuthDTO>("/register", values);
      const loginCredentials: LoginPostDTO = {
        username: values.username,
        password: values.password,
      }
      const response = await apiService.post<UserAuthDTO>("/login", loginCredentials)
      // setToken(response.token)
      // setUserId(response.userId)
      await login(response.token, response.userId);

      router.push(`/users/${response.userId}`)

    } catch (error) {

      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="page-center page-content">
      <div className="card card--form">
        <h2 className="form-title">Create an Account</h2>
        <p className="form-subtitle">Earn points and climb the leaderboard.</p>
        <Form
          form={form}
          name="register"
          size="large"
          variant="outlined"
          onFinish={handleRegistration}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please choose a username!" }]}
          >
            <Input placeholder="Pick a cool name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email!" },
              //{ type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input placeholder="your@email.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter a password!" },
              //{ min: 6, message: "Min. 6 characters" },
            ]}
          >
            <Input.Password placeholder="Min. 6 characters" />
          </Form.Item>
          <Form.Item
            name="userBio"
            label="Bio (optional)"
          >
            <Input.TextArea
              placeholder="Tell us about yourself"
              rows={2}
              maxLength={200}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="form-submit-btn">
              Register & Play
            </Button>
          </Form.Item>
        </Form>
        <div className="form-footer">
          Already a member?{" "}
          <span className="form-footer-link" onClick={() => router.push("/login")}>
            Log in
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
