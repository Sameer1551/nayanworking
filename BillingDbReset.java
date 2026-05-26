import java.sql.*;
public class BillingDbReset {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:mysql://localhost:3306/nayan-db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    try (Connection conn = DriverManager.getConnection(url, "root", "root")) {
      try (Statement st = conn.createStatement()) {
        st.execute("SET FOREIGN_KEY_CHECKS=0");
