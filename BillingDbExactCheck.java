import java.sql.*;
public class BillingDbExactCheck {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:mysql://localhost:3306/nayan-db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    try (Connection conn = DriverManager.getConnection(url, "root", "root")) {
      try (Statement st = conn.createStatement()) {
        try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM billing_records")) { rs.next(); System.out.println("billing_records exact=" + rs.getInt(1)); }
        try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM billing_products")) { rs.next(); System.out.println("billing_products exact=" + rs.getInt(1)); }
        try (ResultSet rs = st.executeQuery("SELECT id, bill_number FROM billing_records ORDER BY id")) {
          while (rs.next()) {
            System.out.println("id=" + rs.getLong(1) + ", bill=" + rs.getString(2));
          }
        }
      }
    }
  }
}
