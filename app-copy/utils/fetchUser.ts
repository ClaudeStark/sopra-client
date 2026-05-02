import { ApiService } from "@/api/apiService";
import { MyUserDTO } from "@/types/user";
import { UserDTO } from "@/types/user";




export async function fetchUser(userId: number, token: string) {
    const apiService = new ApiService();

    try {
        const userData = await apiService.get(
            `/users/${Number(userId)}`,
            {
                headers: { token: token },
            }
        ) as MyUserDTO | UserDTO;;

        if ("email" in userData) {
            return userData as MyUserDTO;
        } else {
            return userData as UserDTO;

        }
    }
    catch (error) {
        throw error
    }
};

