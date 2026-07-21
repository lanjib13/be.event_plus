const supabase = require("../config/supabase");

const countTable = async (table) => {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count || 0;
};

const adminDashboard = async (req, res) => {
  const totalUsers = await countTable("users");
  const totalOrganizers = await countTable("organizers");
  const totalEvents = await countTable("events");
  const totalOrders = await countTable("orders");
  const totalTickets = await countTable("tickets");

  const { data: paidOrders } = await supabase
    .from("orders")
    .select("total_price")
    .eq("payment_status", "paid");

  const totalRevenue = paidOrders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

  res.json({
    success: true,
    message: "Dashboard admin",
    data: {
      totalUsers,
      totalOrganizers,
      totalEvents,
      totalOrders,
      totalTickets,
      totalRevenue,
    },
  });
};

const organizerDashboard = async (req, res) => {
  const { organizerId } = req.params;

  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", organizerId);

  const eventIds = events?.map((event) => event.id) || [];

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .in("event_id", eventIds);

  res.json({
    success: true,
    message: "Dashboard organizer",
    data: {
      totalEvents: events?.length || 0,
      totalTicketsSold: tickets?.length || 0,
      events,
    },
  });
};

const userDashboard = async (req, res) => {
  const { userId } = req.params;

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId);

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*, events(title, location, start_date, end_date, banner_url)")
    .eq("user_id", userId);

  res.json({
    success: true,
    message: "Dashboard user",
    data: {
      totalOrders: orders?.length || 0,
      totalTickets: tickets?.length || 0,
      orders,
      tickets,
    },
  });
};

module.exports = {
  adminDashboard,
  organizerDashboard,
  userDashboard,
};
