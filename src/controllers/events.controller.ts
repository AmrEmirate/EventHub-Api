import { Request, Response } from "express";
import * as eventService from "../service/events.service";
import { Event, UserRole } from "@prisma/client";
import { z } from "zod";

// Skema dasar event
const rawEventSchema = z.object({
  name: z.string().min(5, { message: "Nama minimal 5 karakter" }),
  description: z.string().min(20, { message: "Deskripsi minimal 20 karakter" }),
  category: z.string().min(1, { message: "Kategori wajib diisi" }),
  location: z.string().min(1, { message: "Lokasi wajib diisi" }),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isFree: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().default(false)
  ),
  ticketTotal: z.preprocess(
    (val) => Number(val),
    z.number().int().positive({ message: "Jumlah tiket harus angka positif" })
  ),
  price: z.preprocess((val) => Number(val), z.number().optional()),
});

// Skema untuk membuat event
const createEventSchema = rawEventSchema
  .refine(
    (data) => {
      if (!data.isFree && (data.price === undefined || data.price <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Harga wajib diisi dan harus lebih dari 0 untuk event berbayar",
      path: ["price"],
    }
  )
  .transform((data) => {
    if (data.isFree) {
      return { ...data, price: 0 };
    }
    return { ...data, price: data.price! };
  });

// Skema untuk update event
const updateEventSchema = rawEventSchema
  .partial()
  .refine(
    (data) => {
      if (
        data.isFree === false &&
        (data.price === undefined || data.price <= 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Harga wajib diisi dan harus lebih dari 0 jika event diubah menjadi berbayar",
      path: ["price"],
    }
  )
  .transform((data) => {
    if (data.isFree === true) {
      return { ...data, price: 0 };
    }
    return data;
  });

export const getAllEventsController = async (req: Request, res: Response) => {
  try {
    const events = await eventService.getAllEvents(req.query);
    res.status(200).json(events);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Gagal mengambil event", error: error.message });
  }
};

export const getEventByIdController = async (req: Request, res: Response) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event tidak ditemukan" });
    }
    res.status(200).json(event);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Gagal mengambil event", error: error.message });
  }
};

export const getEventBySlugController = async (req: Request, res: Response) => {
  try {
    const event = await eventService.getEventBySlug(req.params.slug);
    if (!event) {
      return res.status(404).json({ message: "Event tidak ditemukan" });
    }
    res.status(200).json(event);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Gagal mengambil event", error: error.message });
  }
};

export const createEventController = async (req: Request, res: Response) => {
  if (req.user?.role !== UserRole.ORGANIZER) {
    return res
      .status(403)
      .json({
        message: "Akses ditolak. Hanya organizer yang bisa membuat event.",
      });
  }
  try {
    const validatedData = createEventSchema.parse(req.body);

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const eventData = { ...validatedData, organizerId: req.user.id, imageUrl };
    const newEvent = await eventService.createEvent(eventData);
    res.status(201).json({ message: "Event berhasil dibuat", data: newEvent });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({
          message: "Input tidak valid",
          errors: error.flatten().fieldErrors,
        });
    }
    res
      .status(500)
      .json({ message: "Gagal membuat event", error: error.message });
  }
};

export const updateEventController = async (req: Request, res: Response) => {
  if (req.user?.role !== UserRole.ORGANIZER) {
    return res.status(403).json({ message: "Akses ditolak." });
  }
  try {
    const validatedData = updateEventSchema.parse(req.body);

    const dataToUpdate: Partial<Event> = { ...validatedData };

    if (req.file) {
      dataToUpdate.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedEvent = await eventService.updateEvent(
      req.params.id,
      req.user.id,
      dataToUpdate
    );
    res
      .status(200)
      .json({ message: "Event berhasil diperbarui", data: updatedEvent });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({
          message: "Input tidak valid",
          errors: error.flatten().fieldErrors,
        });
    }
    res.status(403).json({ message: error.message });
  }
};

export const deleteEventController = async (req: Request, res: Response) => {
  if (req.user?.role !== UserRole.ORGANIZER) {
    return res.status(403).json({ message: "Akses ditolak." });
  }
  try {
    await eventService.deleteEvent(req.params.id, req.user.id);
    res.status(200).json({ message: "Event berhasil dihapus" });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};

export const getEventAttendeesController = async (
  req: Request,
  res: Response
) => {
  if (req.user?.role !== UserRole.ORGANIZER) {
    return res.status(403).json({ message: "Akses ditolak." });
  }
  try {
    const attendees = await eventService.getEventAttendees(
      req.user.id,
      req.params.id
    );
    res.status(200).json(attendees);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyOrganizerEventsController = async (
  req: Request,
  res: Response
) => {
  if (req.user?.role !== "ORGANIZER") {
    return res.status(403).json({ message: "Akses ditolak." });
  }
  try {
    const events = await eventService.getMyOrganizerEvents(req.user.id);
    res.status(200).json(events);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Gagal mengambil event Anda", error: error.message });
  }
};
