package userManagement.demo;

import org.springframework.web.bind.annotation.*;
import java.util.UUID;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class userController {

    private final UserRepository userRepository;

    public userController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/users")
    public User addUser(@RequestBody User user) {
        if("admin".equals(user.getUserType())) {
            user.setStatus("PENDING");
        }
        else {
            user.setStatus("Approved");
        }
        return userRepository.save(user);
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    //deletes a user by id
    @DeleteMapping("/users/{id}")
    public String delUser(@PathVariable Integer id) {
        if(userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return "User with id " + id + " deleted successfully";
        }
        throw new RuntimeException("User not found with id " +id);
    }

    @PutMapping("/users/{id}")
    public User updateUser(@PathVariable Integer id, @RequestBody User userDetails) {
        return userRepository.findById(id)
                .map(existingUser -> {
                    // 2. Update the fields with the new data sent from Postman/Swagger
                    if(userDetails.getName() != null) existingUser.setName(userDetails.getName());
                    if(userDetails.getEmail() != null) existingUser.setEmail(userDetails.getEmail());
                    if(userDetails.getPassword() != null) existingUser.setPassword(userDetails.getPassword());
                    if(userDetails.getUserType() != null) existingUser.setUserType(userDetails.getUserType());
                    if (userDetails.getStatus() != null) existingUser.setStatus(userDetails.getStatus());

                    if(userDetails.getPassword()!=null) {
                        existingUser.setPassword(userDetails.getPassword());
                    }
                    existingUser.setCurrentSessionId(userDetails.getCurrentSessionId());
                    return userRepository.save(existingUser);
                })
                .orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }
    @GetMapping("/users/{id}")
    public User getUserById(@PathVariable Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }

    @GetMapping("/users/role/{type}")
    public List<User> getUsersByRole(@PathVariable String type) {
        return userRepository.findByUserType(type);
    }

    @PostMapping("/users/login")
    public User loginUser(@RequestBody User loginDetails) {
        User user = userRepository.findByEmail(loginDetails.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        if("PENDING".equals(user.getStatus())) {
            throw new RuntimeException("Account is pending admin approval");
        }
        if (user.getPassword().equals(loginDetails.getPassword())) {
            user.setCurrentSessionId(UUID.randomUUID().toString());
            return userRepository.save(user);
        } else {
            throw new RuntimeException("Invalid email or password");
        }
    }





}