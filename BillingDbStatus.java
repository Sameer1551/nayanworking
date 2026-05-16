import java.sql.*;
public class BillingDbStatus {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:mysql://localhost:3306/nayan-db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    try (Connection conn = DriverManager.getConnection(url, "root", "root")) {
      try (Statement st = conn.createStatement()) {
        try (ResultSet rs = st.executeQuery("SHOW TABLE STATUS LIKE 'billing_records'")) {
          while (rs.next()) {
            System.out.println("Rows=" + rs.getString("Rows") + ", Auto_increment=" + rs.getString("Auto_increment"));
          }
        }
      }
    }
  }
}
