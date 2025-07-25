import { asyncWrapper } from "../../middleware/asyncWrapper";
import { NextFunction, Request, Response } from "express";
import { fetchEmailList } from "../../services/email.service";
import {
  getEmailsQuerySchema,
  getSystemEmailsQuerySchema,
} from "../schemas/systemLabelReq.schemas";

export const getAllInboxEmails = asyncWrapper(
  async (req: Request, res: Response) => {
    // const {emailAccountIds, page, limit} = req.query;
    const validatedQuery = getEmailsQuerySchema.parse(req.query);
    // console.log("getAllInboxEmails", validatedQuery);
    // const { emailAccountIds, page, limit } = req.body;
    const appUserId = req.session.userId!;
    const { emails, hasNextPage, currentPage, nextPage } = await fetchEmailList(
      {
        appUserId,
        emailAccountIds: validatedQuery.emailAccountIds,
        systemView: validatedQuery.systemView,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        inboxCategory: validatedQuery.inboxCategory,
      }
    );
    res.status(200).json({
      emails,
      hasNextPage,
      currentPage,
      nextPage,
    });
  }
);
export const getOthersInboxEmails = asyncWrapper(
  async (req: Request, res: Response) => {
    const validatedQuery = getEmailsQuerySchema.parse(req.query);
    const appUserId = req.session.userId!;
    const { emails, hasNextPage, currentPage, nextPage } = await fetchEmailList(
      {
        appUserId,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        systemView: validatedQuery.systemView,
        emailAccountIds: validatedQuery.emailAccountIds,
        inboxCategory: validatedQuery.inboxCategory,
      }
    );
    res.status(200).json({
      emails,
      hasNextPage,
      currentPage,
      nextPage,
    });
  }
);
export const getInboxEmailsByLabel = asyncWrapper(
  async (req: Request, res: Response) => {
    const { labelId } = req.params;
    const validatedQuery = getEmailsQuerySchema.parse(req.query);
    const appUserId = req.session.userId!;
    const { emails, hasNextPage, currentPage, nextPage } = await fetchEmailList(
      {
        appUserId,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        systemView: validatedQuery.systemView,
        emailAccountIds: validatedQuery.emailAccountIds,
        inboxCategory: validatedQuery.inboxCategory,
        userLabelId: labelId,
      }
    );
    res.status(200).json({
      emails,
      hasNextPage,
      currentPage,
      nextPage,
    });
  }
);

export const getSystemLabelEmails = asyncWrapper(
  async (req: Request, res: Response) => {
    const validatedQuery = getSystemEmailsQuerySchema.parse({
      ...req.query,
      ...req.params,
    });
    // const { emailAccountIds, page, limit } = req.body;
    const appUserId = req.session.userId!;
    const { emails, hasNextPage, currentPage, nextPage } = await fetchEmailList(
      {
        appUserId,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        systemView: validatedQuery.systemLabelId,
        emailAccountIds: validatedQuery.emailAccountIds,
      }
    );
    res.status(200).json({
      emails,
      hasNextPage,
      currentPage,
      nextPage,
    });
  }
);
